import { evaluateNumericExpression } from './expression';
import {
  createGlobalMatrix,
  matVecDense,
  solveReducedSystem,
  zeroMatrix,
  type MatrixBackendType,
} from './femLinearAlgebra';

export type NumericInput = number | string;
export type Vec3 = [NumericInput, NumericInput, NumericInput];
export type Vec6 = [NumericInput, NumericInput, NumericInput, NumericInput, NumericInput, NumericInput];
export type FrameDof3D = 'ux' | 'uy' | 'uz' | 'rx' | 'ry' | 'rz';
export type FrameConstraint3D = Partial<Record<FrameDof3D, NumericInput | true>>;

export type SpaceFrameNodeInput = {
  label: string;
  coords: Vec3;
  constraints?: FrameConstraint3D;
};

export type SpaceFrameMaterialInput = {
  label: string;
  E: NumericInput;
  G: NumericInput;
  yieldStrength?: NumericInput;
};

export type SpaceFrameSectionInput = {
  label: string;
  A: NumericInput;
  Iy: NumericInput;
  Iz: NumericInput;
  J: NumericInput;
  Wy?: NumericInput;
  Wz?: NumericInput;
  Wt?: NumericInput;
};

export type SpaceFrameElementInput = {
  label: string;
  nodes: [string, string];
  material?: string;
  section?: string;
  E?: NumericInput;
  G?: NumericInput;
  A?: NumericInput;
  Iy?: NumericInput;
  Iz?: NumericInput;
  J?: NumericInput;
  Wy?: NumericInput;
  Wz?: NumericInput;
  Wt?: NumericInput;
  yieldStrength?: NumericInput;
  localAxisRef?: Vec3;
};

export type SpaceFrameLoadInput = {
  node: string;
  values: Vec6;
};

export type SpaceFrameModelInput = {
  nodes: SpaceFrameNodeInput[];
  elements: SpaceFrameElementInput[];
  materials?: SpaceFrameMaterialInput[];
  sections?: SpaceFrameSectionInput[];
  nodalLoads?: SpaceFrameLoadInput[];
  symbols?: Record<string, number>;
  matrixBackend?: MatrixBackendType;
};

export type SpaceFrameElementForces = {
  start: [number, number, number, number, number, number];
  end: [number, number, number, number, number, number];
};

export type SpaceFrameElementResult = {
  label: string;
  nodes: [string, string];
  length: number;
  localAxes: {
    x: [number, number, number];
    y: [number, number, number];
    z: [number, number, number];
  };
  localEndForces: SpaceFrameElementForces;
  maxNormalStress: number | null;
  maxShearStress: number | null;
  safetyFactor: number | null;
};

export type SpaceFrame3DResult = {
  displacements: Record<string, [number, number, number, number, number, number]>;
  reactions: Record<string, [number, number, number, number, number, number]>;
  elements: SpaceFrameElementResult[];
  maxDisplacement: {
    node: string | null;
    value: number;
  };
  globalStiffness: number[][];
  residualNorm: number;
};

const dofs: FrameDof3D[] = ['ux', 'uy', 'uz', 'rx', 'ry', 'rz'];
const minLength = 1e-12;

const valueOf = (value: NumericInput | undefined, symbols?: Record<string, number>) => {
  if (value === undefined) throw new Error('Missing numeric value.');
  return evaluateNumericExpression(value, symbols);
};

const vectorNorm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (a: number[], b: number[]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const normalize = (v: number[]): [number, number, number] => {
  const length = vectorNorm(v);
  if (length <= minLength) throw new Error('Cannot normalize a zero-length vector.');
  return [v[0] / length, v[1] / length, v[2] / length];
};

const transpose = (matrix: number[][]) => matrix[0].map((_, col) => matrix.map((row) => row[col]));

const multiplyMatrix = (a: number[][], b: number[][]) => {
  const result = zeroMatrix(a.length, b[0].length);

  for (let row = 0; row < a.length; row++) {
    for (let col = 0; col < b[0].length; col++) {
      for (let index = 0; index < b.length; index++) {
        result[row][col] += a[row][index] * b[index][col];
      }
    }
  }

  return result;
};

const setSym = (matrix: number[][], row: number, col: number, value: number) => {
  matrix[row][col] = value;
  matrix[col][row] = value;
};

const evaluateAxisRef = (axisRef: Vec3 | undefined, symbols?: Record<string, number>): [number, number, number] => {
  if (!axisRef) return [0, 0, 1];
  return [valueOf(axisRef[0], symbols), valueOf(axisRef[1], symbols), valueOf(axisRef[2], symbols)];
};

export const computeSpaceFrame3DLocalAxes = (
  start: [number, number, number],
  end: [number, number, number],
  localAxisRef?: [number, number, number]
) => {
  const x = normalize([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
  let ref = localAxisRef ?? [0, 0, 1];

  if (vectorNorm(cross(ref, x)) <= 1e-8) {
    ref = Math.abs(dot(x, [0, 1, 0])) < 0.95 ? [0, 1, 0] : [1, 0, 0];
  }

  const y = normalize(cross(ref, x));
  const z = normalize(cross(x, y));

  return { x, y, z };
};

export const computeSpaceFrame3DLocalStiffness = (properties: {
  length: number;
  E: number;
  G: number;
  A: number;
  Iy: number;
  Iz: number;
  J: number;
}) => {
  const { length: L, E, G, A, Iy, Iz, J } = properties;

  if (L <= minLength) throw new Error('Space frame element length must be greater than zero.');
  if (E <= 0) throw new Error('Space frame material E must be greater than zero.');
  if (G <= 0) throw new Error('Space frame material G must be greater than zero.');
  if (A <= 0) throw new Error('Space frame section A must be greater than zero.');
  if (Iy <= 0) throw new Error('Space frame section Iy must be greater than zero.');
  if (Iz <= 0) throw new Error('Space frame section Iz must be greater than zero.');
  if (J <= 0) throw new Error('Space frame section J must be greater than zero.');

  const L2 = L * L;
  const L3 = L2 * L;
  const k = zeroMatrix(12, 12);
  const EA = (E * A) / L;
  const GJ = (G * J) / L;
  const EIy = E * Iy;
  const EIz = E * Iz;

  setSym(k, 0, 0, EA);
  setSym(k, 0, 6, -EA);
  setSym(k, 6, 6, EA);

  setSym(k, 3, 3, GJ);
  setSym(k, 3, 9, -GJ);
  setSym(k, 9, 9, GJ);

  setSym(k, 1, 1, (12 * EIz) / L3);
  setSym(k, 1, 5, (6 * EIz) / L2);
  setSym(k, 1, 7, (-12 * EIz) / L3);
  setSym(k, 1, 11, (6 * EIz) / L2);
  setSym(k, 5, 5, (4 * EIz) / L);
  setSym(k, 5, 7, (-6 * EIz) / L2);
  setSym(k, 5, 11, (2 * EIz) / L);
  setSym(k, 7, 7, (12 * EIz) / L3);
  setSym(k, 7, 11, (-6 * EIz) / L2);
  setSym(k, 11, 11, (4 * EIz) / L);

  setSym(k, 2, 2, (12 * EIy) / L3);
  setSym(k, 2, 4, (-6 * EIy) / L2);
  setSym(k, 2, 8, (-12 * EIy) / L3);
  setSym(k, 2, 10, (-6 * EIy) / L2);
  setSym(k, 4, 4, (4 * EIy) / L);
  setSym(k, 4, 8, (6 * EIy) / L2);
  setSym(k, 4, 10, (2 * EIy) / L);
  setSym(k, 8, 8, (12 * EIy) / L3);
  setSym(k, 8, 10, (6 * EIy) / L2);
  setSym(k, 10, 10, (4 * EIy) / L);

  return k;
};

export const computeSpaceFrame3DTransformation = (localAxes: {
  x: [number, number, number];
  y: [number, number, number];
  z: [number, number, number];
}) => {
  const rotation = [localAxes.x, localAxes.y, localAxes.z];
  const t = zeroMatrix(12, 12);

  for (const offset of [0, 3, 6, 9]) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        t[offset + row][offset + col] = rotation[row][col];
      }
    }
  }

  return t;
};

export const transformSpaceFrame3DStiffnessToGlobal = (localStiffness: number[][], transformation: number[][]) => {
  return multiplyMatrix(transpose(transformation), multiplyMatrix(localStiffness, transformation));
};

export const solveSpaceFrame3D = (model: SpaceFrameModelInput): SpaceFrame3DResult => {
  const symbols = model.symbols;
  const nodeMap = new Map(model.nodes.map((node) => [node.label, node]));
  const materialMap = new Map((model.materials ?? []).map((material) => [material.label, material]));
  const sectionMap = new Map((model.sections ?? []).map((section) => [section.label, section]));
  const dofIndex = new Map<string, number>();
  const totalDofs = model.nodes.length * 6;
  const globalK = createGlobalMatrix(totalDofs, model.matrixBackend);
  const force = Array.from({ length: totalDofs }, () => 0);
  const displacement = Array.from({ length: totalDofs }, () => 0);

  model.nodes.forEach((node, nodeIndex) => {
    dofs.forEach((dof, localIndex) => {
      dofIndex.set(`${node.label}:${dof}`, nodeIndex * 6 + localIndex);
    });
  });

  const resolveNodeCoords = (label: string): [number, number, number] => {
    const node = nodeMap.get(label);
    if (!node) throw new Error(`Space frame node "${label}" was not found.`);

    return [
      valueOf(node.coords[0], symbols),
      valueOf(node.coords[1], symbols),
      valueOf(node.coords[2], symbols),
    ];
  };

  const getElementProperties = (element: SpaceFrameElementInput) => {
    const material = element.material ? materialMap.get(element.material) : undefined;
    const section = element.section ? sectionMap.get(element.section) : undefined;
    const E = valueOf(element.E ?? material?.E, symbols);
    const G = valueOf(element.G ?? material?.G, symbols);
    const A = valueOf(element.A ?? section?.A, symbols);
    const Iy = valueOf(element.Iy ?? section?.Iy, symbols);
    const Iz = valueOf(element.Iz ?? section?.Iz, symbols);
    const J = valueOf(element.J ?? section?.J, symbols);
    const Wy = element.Wy !== undefined || section?.Wy !== undefined ? valueOf(element.Wy ?? section?.Wy, symbols) : undefined;
    const Wz = element.Wz !== undefined || section?.Wz !== undefined ? valueOf(element.Wz ?? section?.Wz, symbols) : undefined;
    const Wt = element.Wt !== undefined || section?.Wt !== undefined ? valueOf(element.Wt ?? section?.Wt, symbols) : undefined;
    const yieldStrength =
      element.yieldStrength !== undefined || material?.yieldStrength !== undefined
        ? valueOf(element.yieldStrength ?? material?.yieldStrength, symbols)
        : undefined;

    return { E, G, A, Iy, Iz, J, Wy, Wz, Wt, yieldStrength };
  };

  const elementState = new Map<
    string,
    {
      length: number;
      localAxes: SpaceFrameElementResult['localAxes'];
      localStiffness: number[][];
      transformation: number[][];
      E: number;
      A: number;
      Wy?: number;
      Wz?: number;
      Wt?: number;
      yieldStrength?: number;
    }
  >();

  for (const element of model.elements) {
    const start = resolveNodeCoords(element.nodes[0]);
    const end = resolveNodeCoords(element.nodes[1]);
    const length = vectorNorm([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
    const localAxes = computeSpaceFrame3DLocalAxes(start, end, evaluateAxisRef(element.localAxisRef, symbols));
    const props = getElementProperties(element);
    const localStiffness = computeSpaceFrame3DLocalStiffness({ length, ...props });
    const transformation = computeSpaceFrame3DTransformation(localAxes);
    const stiffness = transformSpaceFrame3DStiffnessToGlobal(localStiffness, transformation);
    const location = element.nodes.flatMap((nodeLabel) => dofs.map((dof) => dofIndex.get(`${nodeLabel}:${dof}`)));

    if (location.some((index) => index === undefined)) {
      throw new Error(`Space frame element "${element.label}" references an unknown node.`);
    }

    globalK.addSubmatrix(location as number[], stiffness);
    elementState.set(element.label, {
      length,
      localAxes,
      localStiffness,
      transformation,
      E: props.E,
      A: props.A,
      Wy: props.Wy,
      Wz: props.Wz,
      Wt: props.Wt,
      yieldStrength: props.yieldStrength,
    });
  }

  for (const load of model.nodalLoads ?? []) {
    if (!nodeMap.has(load.node)) throw new Error(`Space frame load references unknown node "${load.node}".`);

    dofs.forEach((dof, index) => {
      force[dofIndex.get(`${load.node}:${dof}`)] += valueOf(load.values[index], symbols);
    });
  }

  const constrained = new Set<number>();

  for (const node of model.nodes) {
    dofs.forEach((dof) => {
      const constraint = node.constraints?.[dof];
      if (constraint === undefined) return;

      const index = dofIndex.get(`${node.label}:${dof}`);
      constrained.add(index);
      displacement[index] = constraint === true ? 0 : valueOf(constraint, symbols);
    });
  }

  const free = Array.from({ length: totalDofs }, (_, index) => index).filter((index) => !constrained.has(index));
  const fixed = Array.from(constrained.values()).sort((a, b) => a - b);

  if (free.length > 0) {
    const solved = solveReducedSystem(globalK, force, displacement, free, fixed, {
      context: 'Space frame global stiffness',
    });

    solved.forEach((value, index) => {
      displacement[free[index]] = value;
    });
  }

  const internalForce = globalK.matVec(displacement);
  const residual = internalForce.map((value, index) => value - force[index]);
  const displacements: SpaceFrame3DResult['displacements'] = {};
  const reactions: SpaceFrame3DResult['reactions'] = {};
  let maxDisplacement = { node: null as string | null, value: 0 };

  for (const node of model.nodes) {
    const indices = dofs.map((dof) => dofIndex.get(`${node.label}:${dof}`));
    const nodeDisplacement = indices.map((index) => displacement[index]) as [number, number, number, number, number, number];
    const nodeReaction = indices.map((index) => (constrained.has(index) ? residual[index] : 0)) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const displacementNorm = vectorNorm(nodeDisplacement.slice(0, 3));

    displacements[node.label] = nodeDisplacement;
    reactions[node.label] = nodeReaction;

    if (displacementNorm > maxDisplacement.value) {
      maxDisplacement = { node: node.label, value: displacementNorm };
    }
  }

  const elements = model.elements.map((element) => {
    const state = elementState.get(element.label);
    const location = element.nodes.flatMap((nodeLabel) => dofs.map((dof) => dofIndex.get(`${nodeLabel}:${dof}`))) as number[];
    const globalElementDisplacement = location.map((index) => displacement[index]);
    const localElementDisplacement = matVecDense(state.transformation, globalElementDisplacement);
    const localEndForceVector = matVecDense(state.localStiffness, localElementDisplacement);
    const start = localEndForceVector.slice(0, 6) as [number, number, number, number, number, number];
    const end = localEndForceVector.slice(6, 12) as [number, number, number, number, number, number];
    const maxNormalStress =
      state.Wy && state.Wz
        ? Math.max(
            Math.abs(start[0] / state.A) + Math.abs(start[4] / state.Wy) + Math.abs(start[5] / state.Wz),
            Math.abs(end[0] / state.A) + Math.abs(end[4] / state.Wy) + Math.abs(end[5] / state.Wz)
          )
        : null;
    const maxShearStress = Math.max(
      (1.5 * Math.hypot(start[1], start[2])) / state.A + (state.Wt ? Math.abs(start[3]) / state.Wt : 0),
      (1.5 * Math.hypot(end[1], end[2])) / state.A + (state.Wt ? Math.abs(end[3]) / state.Wt : 0)
    );
    const safetyFactor =
      state.yieldStrength !== undefined && maxNormalStress !== null && maxNormalStress > 0
        ? state.yieldStrength / maxNormalStress
        : null;

    return {
      label: element.label,
      nodes: element.nodes,
      length: state.length,
      localAxes: state.localAxes,
      localEndForces: { start, end },
      maxNormalStress,
      maxShearStress,
      safetyFactor,
    };
  });

  return {
    displacements,
    reactions,
    elements,
    maxDisplacement,
    globalStiffness: globalK.toDense(),
    residualNorm: vectorNorm(residual.filter((_, index) => free.includes(index))),
  };
};
