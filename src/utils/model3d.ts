import {
  Beam2D,
  BeamElementTrapezoidalEdgeLoad,
  BeamElementUniformEdgeLoad,
  DofID,
  type LinearStaticSolver,
} from 'ts-fem';
import type {
  Member3D,
  MemberForce3D,
  MemberLocalAxes3D,
  Node3D,
  NodeConstraint3D,
  NodeDisplacement3D,
  StructureSceneModel3D,
  Vector3Data,
} from '@/types/model3d';

const EPSILON = 1e-10;

export const vector3 = (x = 0, y = 0, z = 0): Vector3Data => ({ x, y, z });

export const addVector3 = (a: Vector3Data, b: Vector3Data): Vector3Data =>
  vector3(a.x + b.x, a.y + b.y, a.z + b.z);

export const subtractVector3 = (a: Vector3Data, b: Vector3Data): Vector3Data =>
  vector3(a.x - b.x, a.y - b.y, a.z - b.z);

export const scaleVector3 = (vector: Vector3Data, scale: number): Vector3Data =>
  vector3(vector.x * scale, vector.y * scale, vector.z * scale);

export const dotVector3 = (a: Vector3Data, b: Vector3Data): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const crossVector3 = (a: Vector3Data, b: Vector3Data): Vector3Data =>
  vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const vector3Length = (vector: Vector3Data): number => Math.sqrt(dotVector3(vector, vector));

export const normalizeVector3 = (vector: Vector3Data): Vector3Data => {
  const length = vector3Length(vector);
  if (length < EPSILON) throw new Error('Cannot normalize a zero-length 3D vector.');
  return scaleVector3(vector, 1 / length);
};

/**
 * Builds a right-handed member coordinate system. The fallback reference axis
 * prevents a zero cross product when a member is parallel to global Y.
 */
export const createMemberLocalAxes3D = (
  start: Vector3Data,
  end: Vector3Data,
  localAxisRotation = 0
): MemberLocalAxes3D => {
  const x = normalizeVector3(subtractVector3(end, start));
  const yReference = Math.abs(dotVector3(x, vector3(0, 1, 0))) > 0.95 ? vector3(0, 0, 1) : vector3(0, 1, 0);
  const zBase = normalizeVector3(crossVector3(x, yReference));
  const yBase = normalizeVector3(crossVector3(zBase, x));

  const cos = Math.cos(localAxisRotation);
  const sin = Math.sin(localAxisRotation);
  const y = normalizeVector3(addVector3(scaleVector3(yBase, cos), scaleVector3(zBase, sin)));
  const z = normalizeVector3(crossVector3(x, y));

  return { x, y, z };
};

export const localToGlobalVector3 = (local: Vector3Data, axes: MemberLocalAxes3D): Vector3Data =>
  addVector3(
    addVector3(scaleVector3(axes.x, local.x), scaleVector3(axes.y, local.y)),
    scaleVector3(axes.z, local.z)
  );

export const globalToLocalVector3 = (global: Vector3Data, axes: MemberLocalAxes3D): Vector3Data =>
  vector3(dotVector3(global, axes.x), dotVector3(global, axes.y), dotVector3(global, axes.z));

/** Converts the legacy ts-fem XZ drawing plane to the displayed global XY plane. */
export const legacyCoordsToNode3D = (id: string, coords: readonly number[]): Node3D => ({
  id,
  x: Number(coords[0] ?? 0),
  y: Number(coords[2] ?? 0),
  z: 0,
});

export const legacyVectorToGlobal3D = (x = 0, z = 0, outOfPlane = 0): Vector3Data =>
  vector3(Number(x) || 0, Number(z) || 0, Number(outOfPlane) || 0);

const dofNames: Record<number, NodeConstraint3D['constrainedDofs'][number]> = {
  [DofID.Dx]: 'Ux',
  [DofID.Dy]: 'Uz',
  [DofID.Dz]: 'Uy',
  [DofID.Rx]: 'Rx',
  [DofID.Ry]: 'Rz',
  [DofID.Rz]: 'Ry',
};

const getNodeDisplacement = (node: { label: string; getUnknowns: Function }, solver: LinearStaticSolver): NodeDisplacement3D => {
  const zero = vector3();
  if (!solver.loadCases[0]?.solved) return { nodeId: node.label, translation: zero, rotation: zero };

  try {
    const unknowns = node.getUnknowns(solver.loadCases[0], [DofID.Dx, DofID.Dy, DofID.Dz, DofID.Rx, DofID.Ry, DofID.Rz]);
    const values = unknowns.toArray().flat().map(Number);
    return {
      nodeId: node.label,
      translation: legacyVectorToGlobal3D(values[0], values[2], values[1]),
      rotation: legacyVectorToGlobal3D(values[3], values[5], values[4]),
    };
  } catch {
    return { nodeId: node.label, translation: zero, rotation: zero };
  }
};

const getMemberForces = (beam: Beam2D, solver: LinearStaticSolver): MemberForce3D[] => {
  if (!solver.loadCases[0]?.solved) return [];
  try {
    const n = beam.computeNormalForce(solver.loadCases[0], 12);
    const v = beam.computeShearForce(solver.loadCases[0], 12);
    const m = beam.computeBendingMoment(solver.loadCases[0], 12);
    return n.x.map((position, index) => ({
      memberId: beam.label,
      position,
      axialForce: Number(n.N[index] ?? 0),
      shearY: Number(v.V[index] ?? 0),
      shearZ: 0,
      torsion: 0,
      bendingY: 0,
      bendingZ: Number(m.M[index] ?? 0),
    }));
  } catch {
    return [];
  }
};

/**
 * Adapts the existing planar solver model without mutating it. The displayed
 * plane is XY, while the solver's original XZ coordinates remain untouched.
 */
export const createStructureSceneModel3D = (solver: LinearStaticSolver): StructureSceneModel3D => {
  const nodes = [...solver.domain.nodes.values()].map((node) => legacyCoordsToNode3D(node.label, node.coords));
  const members = [...solver.domain.elements.values()]
    .filter((element): element is Beam2D => element instanceof Beam2D)
    .map(
      (element): Member3D => ({
        id: element.label,
        startNodeId: element.nodes[0],
        endNodeId: element.nodes[1],
        sectionId: element.cs,
        materialId: element.mat,
        localAxisRotation: 0,
      })
    );

  const constraints: NodeConstraint3D[] = [...solver.domain.nodes.values()]
    .filter((node) => node.bcs.size > 0)
    .map((node) => ({
      nodeId: node.label,
      constrainedDofs: [...node.bcs].map((dof) => dofNames[dof]).filter(Boolean),
    }));

  const nodalLoads = solver.loadCases[0].nodalLoadList.map((load) => ({
    nodeId: String(load.target),
    force: legacyVectorToGlobal3D(load.values[DofID.Dx], load.values[DofID.Dz], load.values[DofID.Dy]),
    moment: legacyVectorToGlobal3D(load.values[DofID.Rx], load.values[DofID.Rz], load.values[DofID.Ry]),
    coordinateSystem: 'global' as const,
  }));

  const distributedLoads = solver.loadCases[0].elementLoadList.flatMap((load, index) => {
    if (load instanceof BeamElementUniformEdgeLoad) {
      const intensity = load.getGlobalIntensities();
      const force = legacyVectorToGlobal3D(intensity.fx, intensity.fz);
      return [{ id: `uniform-${index}`, memberId: String(load.target), startForce: force, endForce: force, coordinateSystem: 'global' as const }];
    }
    if (load instanceof BeamElementTrapezoidalEdgeLoad) {
      const intensity = load.getGlobalIntensities();
      return [
        {
          id: `trapezoidal-${index}`,
          memberId: String(load.target),
          startForce: legacyVectorToGlobal3D(intensity.start.fx, intensity.start.fz),
          endForce: legacyVectorToGlobal3D(intensity.end.fx, intensity.end.fz),
          coordinateSystem: 'global' as const,
        },
      ];
    }
    return [];
  });

  const beams = [...solver.domain.elements.values()].filter((element): element is Beam2D => element instanceof Beam2D);
  return {
    coordinateSystem: 'legacy-2d-xz',
    nodes,
    members,
    nodalLoads,
    distributedLoads,
    constraints,
    displacements: [...solver.domain.nodes.values()].map((node) => getNodeDisplacement(node, solver)),
    memberForces: beams.flatMap((beam) => getMemberForces(beam, solver)),
    solved: Boolean(solver.loadCases[0]?.solved),
  };
};

export const calculateAutoDeformationScale = (nodes: Node3D[], displacements: NodeDisplacement3D[]): number => {
  const bounds = nodes.reduce(
    (acc, node) => ({
      min: vector3(Math.min(acc.min.x, node.x), Math.min(acc.min.y, node.y), Math.min(acc.min.z, node.z)),
      max: vector3(Math.max(acc.max.x, node.x), Math.max(acc.max.y, node.y), Math.max(acc.max.z, node.z)),
    }),
    { min: vector3(Infinity, Infinity, Infinity), max: vector3(-Infinity, -Infinity, -Infinity) }
  );
  const span = Math.max(vector3Length(subtractVector3(bounds.max, bounds.min)), 1);
  const maximum = Math.max(...displacements.map((item) => vector3Length(item.translation)), 0);
  return maximum < EPSILON ? 1 : Math.min(1e5, Math.max(1, (span * 0.12) / maximum));
};
