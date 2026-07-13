import { evaluateNumericExpression } from './expression';
import {
  createGlobalMatrix,
  solveReducedSystem,
  zeroMatrix,
  type MatrixBackendType,
} from './femLinearAlgebra';

export type NumericInput = number | string;
export type Vec3 = [NumericInput, NumericInput, NumericInput];
export type Dof3 = 'x' | 'y' | 'z';
export type Constraint3D = Partial<Record<Dof3, NumericInput | true>>;

export type SpaceTrussNodeInput = {
  label: string;
  coords: Vec3;
  constraints?: Constraint3D;
};

export type SpaceTrussMaterialInput = {
  label: string;
  E: NumericInput;
  yieldStrength?: NumericInput;
};

export type SpaceTrussSectionInput = {
  label: string;
  A: NumericInput;
};

export type SpaceTrussElementInput = {
  label: string;
  nodes: [string, string];
  material?: string;
  section?: string;
  E?: NumericInput;
  A?: NumericInput;
  yieldStrength?: NumericInput;
};

export type SpaceTrussLoadInput = {
  node: string;
  values: Vec3;
};

export type SpaceTrussModelInput = {
  nodes: SpaceTrussNodeInput[];
  elements: SpaceTrussElementInput[];
  materials?: SpaceTrussMaterialInput[];
  sections?: SpaceTrussSectionInput[];
  nodalLoads?: SpaceTrussLoadInput[];
  symbols?: Record<string, number>;
  matrixBackend?: MatrixBackendType;
};

export type SpaceTrussElementResult = {
  label: string;
  nodes: [string, string];
  length: number;
  direction: [number, number, number];
  axialForce: number;
  stress: number;
  safetyFactor: number | null;
};

export type SpaceTruss3DResult = {
  displacements: Record<string, [number, number, number]>;
  reactions: Record<string, [number, number, number]>;
  elements: SpaceTrussElementResult[];
  maxDisplacement: {
    node: string | null;
    value: number;
  };
  globalStiffness: number[][];
  residualNorm: number;
};

const dofs: Dof3[] = ['x', 'y', 'z'];
const minLength = 1e-12;

const valueOf = (value: NumericInput | undefined, symbols?: Record<string, number>) => {
  if (value === undefined) throw new Error('Missing numeric value.');
  return evaluateNumericExpression(value, symbols);
};

const vectorNorm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

export const computeSpaceTruss3DElementStiffness = (
  start: [number, number, number],
  end: [number, number, number],
  E: number,
  A: number
) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (length <= minLength) throw new Error('Space truss element length must be greater than zero.');
  if (E <= 0) throw new Error('Space truss material E must be greater than zero.');
  if (A <= 0) throw new Error('Space truss section A must be greater than zero.');

  const l = dx / length;
  const m = dy / length;
  const n = dz / length;
  const direction: [number, number, number] = [l, m, n];
  const a = [l, m, n, -l, -m, -n];
  const factor = (E * A) / length;
  const stiffness = zeroMatrix(6, 6);

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      stiffness[row][col] = factor * a[row] * a[col];
    }
  }

  return { length, direction, stiffness };
};

export const solveSpaceTruss3D = (model: SpaceTrussModelInput): SpaceTruss3DResult => {
  const symbols = model.symbols;
  const nodeMap = new Map(model.nodes.map((node) => [node.label, node]));
  const materialMap = new Map((model.materials ?? []).map((material) => [material.label, material]));
  const sectionMap = new Map((model.sections ?? []).map((section) => [section.label, section]));
  const dofIndex = new Map<string, number>();
  const totalDofs = model.nodes.length * 3;
  const globalK = createGlobalMatrix(totalDofs, model.matrixBackend);
  const force = Array.from({ length: totalDofs }, () => 0);
  const displacement = Array.from({ length: totalDofs }, () => 0);

  model.nodes.forEach((node, nodeIndex) => {
    dofs.forEach((dof, localIndex) => {
      dofIndex.set(`${node.label}:${dof}`, nodeIndex * 3 + localIndex);
    });
  });

  const resolveNodeCoords = (label: string): [number, number, number] => {
    const node = nodeMap.get(label);
    if (!node) throw new Error(`Space truss node "${label}" was not found.`);

    return [
      valueOf(node.coords[0], symbols),
      valueOf(node.coords[1], symbols),
      valueOf(node.coords[2], symbols),
    ];
  };

  const getElementProperties = (element: SpaceTrussElementInput) => {
    const material = element.material ? materialMap.get(element.material) : undefined;
    const section = element.section ? sectionMap.get(element.section) : undefined;
    const E = valueOf(element.E ?? material?.E, symbols);
    const A = valueOf(element.A ?? section?.A, symbols);
    const yieldStrength =
      element.yieldStrength !== undefined || material?.yieldStrength !== undefined
        ? valueOf(element.yieldStrength ?? material?.yieldStrength, symbols)
        : undefined;

    return { E, A, yieldStrength };
  };

  const elementGeometry = new Map<
    string,
    {
      length: number;
      direction: [number, number, number];
      E: number;
      A: number;
      yieldStrength?: number;
    }
  >();

  for (const element of model.elements) {
    const start = resolveNodeCoords(element.nodes[0]);
    const end = resolveNodeCoords(element.nodes[1]);
    const { E, A, yieldStrength } = getElementProperties(element);
    const { length, direction, stiffness } = computeSpaceTruss3DElementStiffness(start, end, E, A);
    const location = element.nodes.flatMap((nodeLabel) => dofs.map((dof) => dofIndex.get(`${nodeLabel}:${dof}`)));

    if (location.some((index) => index === undefined)) {
      throw new Error(`Space truss element "${element.label}" references an unknown node.`);
    }

    globalK.addSubmatrix(location as number[], stiffness);
    elementGeometry.set(element.label, { length, direction, E, A, yieldStrength });
  }

  for (const load of model.nodalLoads ?? []) {
    if (!nodeMap.has(load.node)) throw new Error(`Space truss load references unknown node "${load.node}".`);

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
      context: 'Space truss global stiffness',
    });

    solved.forEach((value, index) => {
      displacement[free[index]] = value;
    });
  }

  const internalForce = globalK.matVec(displacement);
  const residual = internalForce.map((value, index) => value - force[index]);
  const reactions: Record<string, [number, number, number]> = {};
  const displacements: Record<string, [number, number, number]> = {};
  let maxDisplacement = { node: null as string | null, value: 0 };

  for (const node of model.nodes) {
    const indices = dofs.map((dof) => dofIndex.get(`${node.label}:${dof}`));
    const nodeDisplacement = indices.map((index) => displacement[index]) as [number, number, number];
    const nodeReaction = indices.map((index) => (constrained.has(index) ? residual[index] : 0)) as [
      number,
      number,
      number,
    ];
    const displacementNorm = vectorNorm(nodeDisplacement);

    displacements[node.label] = nodeDisplacement;
    reactions[node.label] = nodeReaction;

    if (displacementNorm > maxDisplacement.value) {
      maxDisplacement = { node: node.label, value: displacementNorm };
    }
  }

  const elements = model.elements.map((element) => {
    const geometry = elementGeometry.get(element.label);
    const start = element.nodes[0];
    const end = element.nodes[1];
    const u1 = displacements[start];
    const u2 = displacements[end];
    const relativeAxial =
      geometry.direction[0] * (u2[0] - u1[0]) +
      geometry.direction[1] * (u2[1] - u1[1]) +
      geometry.direction[2] * (u2[2] - u1[2]);
    const axialForce = (geometry.E * geometry.A * relativeAxial) / geometry.length;
    const stress = axialForce / geometry.A;
    const safetyFactor =
      geometry.yieldStrength !== undefined && Math.abs(stress) > 0
        ? geometry.yieldStrength / Math.abs(stress)
        : null;

    return {
      label: element.label,
      nodes: element.nodes,
      length: geometry.length,
      direction: geometry.direction,
      axialForce,
      stress,
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
