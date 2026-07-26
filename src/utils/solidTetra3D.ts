import { evaluateNumericExpression } from './expression';
import {
  createGlobalMatrix,
  matVecDense,
  solveLinearSystem,
  solveReducedSystem,
  zeroMatrix,
  type MatrixBackendType,
} from './femLinearAlgebra';

export type NumericInput = number | string;
export type Vec3 = [NumericInput, NumericInput, NumericInput];
export type SolidDof3D = 'x' | 'y' | 'z';
export type SolidConstraint3D = Partial<Record<SolidDof3D, NumericInput | true>>;

export type SolidTetraNodeInput = {
  label: string;
  coords: Vec3;
  constraints?: SolidConstraint3D;
};

export type SolidTetraMaterialInput = {
  label: string;
  E: NumericInput;
  nu: NumericInput;
  yieldStrength?: NumericInput;
};

export type SolidTetraElementInput = {
  label: string;
  nodes: [string, string, string, string];
  material?: string;
  E?: NumericInput;
  nu?: NumericInput;
  yieldStrength?: NumericInput;
};

export type SolidTetraLoadInput = {
  node: string;
  values: Vec3;
};

export type SolidTetraModelInput = {
  nodes: SolidTetraNodeInput[];
  elements: SolidTetraElementInput[];
  materials?: SolidTetraMaterialInput[];
  nodalLoads?: SolidTetraLoadInput[];
  symbols?: Record<string, number>;
  matrixBackend?: MatrixBackendType;
};

export type SolidTetraElementResult = {
  label: string;
  nodes: [string, string, string, string];
  volume: number;
  centroid: [number, number, number];
  strain: [number, number, number, number, number, number];
  stress: [number, number, number, number, number, number];
  vonMisesStress: number;
  safetyFactor: number | null;
};

export type SolidTetra3DResult = {
  displacements: Record<string, [number, number, number]>;
  reactions: Record<string, [number, number, number]>;
  elements: SolidTetraElementResult[];
  critical: {
    maxDisplacement: { node: string | null; value: number };
    maxVonMisesStress: { element: string | null; value: number };
    minSafetyFactor: { element: string | null; value: number | null };
  };
  globalStiffness: number[][];
  residualNorm: number;
};

const dofs: SolidDof3D[] = ['x', 'y', 'z'];
const minVolume = 1e-18;

const valueOf = (value: NumericInput | undefined, symbols?: Record<string, number>) => {
  if (value === undefined) throw new Error('Missing numeric value.');
  return evaluateNumericExpression(value, symbols);
};

const vectorNorm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

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

const scaleMatrix = (matrix: number[][], factor: number) => matrix.map((row) => row.map((value) => value * factor));

const determinant = (matrix: number[][]) => {
  const a = matrix.map((row) => [...row]);
  let det = 1;

  for (let col = 0; col < a.length; col++) {
    let pivot = col;

    for (let row = col + 1; row < a.length; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }

    if (Math.abs(a[pivot][col]) <= 1e-30) return 0;

    if (pivot !== col) {
      [a[pivot], a[col]] = [a[col], a[pivot]];
      det *= -1;
    }

    const pivotValue = a[col][col];
    det *= pivotValue;

    for (let row = col + 1; row < a.length; row++) {
      const factor = a[row][col] / pivotValue;

      for (let nextCol = col + 1; nextCol < a.length; nextCol++) {
        a[row][nextCol] -= factor * a[col][nextCol];
      }
    }
  }

  return det;
};

export const computeSolidTetra3DElasticMatrix = (E: number, nu: number) => {
  if (E <= 0) throw new Error('Solid tetra material E must be greater than zero.');
  if (nu <= -1 || nu >= 0.5) throw new Error('Solid tetra Poisson ratio nu must be between -1 and 0.5.');

  const factor = E / ((1 + nu) * (1 - 2 * nu));
  const c11 = 1 - nu;
  const c12 = nu;
  const c44 = (1 - 2 * nu) / 2;

  return scaleMatrix(
    [
      [c11, c12, c12, 0, 0, 0],
      [c12, c11, c12, 0, 0, 0],
      [c12, c12, c11, 0, 0, 0],
      [0, 0, 0, c44, 0, 0],
      [0, 0, 0, 0, c44, 0],
      [0, 0, 0, 0, 0, c44],
    ],
    factor
  );
};

export const computeSolidTetra3DGeometry = (coords: [number, number, number][]) => {
  if (coords.length !== 4) throw new Error('A solid tetra element requires exactly four nodes.');

  const interpolation = coords.map((coord) => [1, coord[0], coord[1], coord[2]]);
  const signedVolume = determinant(interpolation) / 6;
  const volume = Math.abs(signedVolume);

  if (volume <= minVolume) throw new Error('Solid tetra element volume must be greater than zero.');

  const gradients = Array.from({ length: 4 }, (_, nodeIndex) => {
    const rhs = [0, 0, 0, 0];
    rhs[nodeIndex] = 1;
    const coeffs = solveLinearSystem(interpolation, rhs, { context: 'Solid tetra interpolation' });
    return [coeffs[1], coeffs[2], coeffs[3]] as [number, number, number];
  });

  const centroid = [
    coords.reduce((sum, coord) => sum + coord[0], 0) / 4,
    coords.reduce((sum, coord) => sum + coord[1], 0) / 4,
    coords.reduce((sum, coord) => sum + coord[2], 0) / 4,
  ] as [number, number, number];

  return { volume, signedVolume, gradients, centroid };
};

export const computeSolidTetra3DStrainDisplacement = (gradients: [number, number, number][]) => {
  const b = zeroMatrix(6, 12);

  gradients.forEach(([nx, ny, nz], nodeIndex) => {
    const offset = nodeIndex * 3;

    b[0][offset] = nx;
    b[1][offset + 1] = ny;
    b[2][offset + 2] = nz;
    b[3][offset] = ny;
    b[3][offset + 1] = nx;
    b[4][offset + 1] = nz;
    b[4][offset + 2] = ny;
    b[5][offset] = nz;
    b[5][offset + 2] = nx;
  });

  return b;
};

export const computeSolidTetra3DElementStiffness = (coords: [number, number, number][], E: number, nu: number) => {
  const geometry = computeSolidTetra3DGeometry(coords);
  const d = computeSolidTetra3DElasticMatrix(E, nu);
  const b = computeSolidTetra3DStrainDisplacement(geometry.gradients);
  const stiffness = scaleMatrix(multiplyMatrix(transpose(b), multiplyMatrix(d, b)), geometry.volume);

  return { ...geometry, elasticity: d, strainDisplacement: b, stiffness };
};

export const computeVonMisesStress3D = (stress: [number, number, number, number, number, number]) => {
  const [sx, sy, sz, txy, tyz, tzx] = stress;

  return Math.sqrt(
    0.5 * ((sx - sy) ** 2 + (sy - sz) ** 2 + (sz - sx) ** 2) + 3 * (txy ** 2 + tyz ** 2 + tzx ** 2)
  );
};

export const solveSolidTetra3D = (model: SolidTetraModelInput): SolidTetra3DResult => {
  const symbols = model.symbols;
  const nodeMap = new Map(model.nodes.map((node) => [node.label, node]));
  const materialMap = new Map((model.materials ?? []).map((material) => [material.label, material]));
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
    if (!node) throw new Error(`Solid tetra node "${label}" was not found.`);

    return [
      valueOf(node.coords[0], symbols),
      valueOf(node.coords[1], symbols),
      valueOf(node.coords[2], symbols),
    ];
  };

  const getElementProperties = (element: SolidTetraElementInput) => {
    const material = element.material ? materialMap.get(element.material) : undefined;
    const E = valueOf(element.E ?? material?.E, symbols);
    const nu = valueOf(element.nu ?? material?.nu, symbols);
    const yieldStrength =
      element.yieldStrength !== undefined || material?.yieldStrength !== undefined
        ? valueOf(element.yieldStrength ?? material?.yieldStrength, symbols)
        : undefined;

    return { E, nu, yieldStrength };
  };

  const elementState = new Map<
    string,
    {
      volume: number;
      centroid: [number, number, number];
      strainDisplacement: number[][];
      elasticity: number[][];
      yieldStrength?: number;
    }
  >();

  for (const element of model.elements) {
    const coords = element.nodes.map(resolveNodeCoords);
    const { E, nu, yieldStrength } = getElementProperties(element);
    const elementResult = computeSolidTetra3DElementStiffness(coords, E, nu);
    const location = element.nodes.flatMap((nodeLabel) => dofs.map((dof) => dofIndex.get(`${nodeLabel}:${dof}`)));

    if (location.some((index) => index === undefined)) {
      throw new Error(`Solid tetra element "${element.label}" references an unknown node.`);
    }

    globalK.addSubmatrix(location as number[], elementResult.stiffness);
    elementState.set(element.label, {
      volume: elementResult.volume,
      centroid: elementResult.centroid,
      strainDisplacement: elementResult.strainDisplacement,
      elasticity: elementResult.elasticity,
      yieldStrength,
    });
  }

  for (const load of model.nodalLoads ?? []) {
    if (!nodeMap.has(load.node)) throw new Error(`Solid tetra load references unknown node "${load.node}".`);

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
      context: 'Solid tetra global stiffness',
    });

    solved.forEach((value, index) => {
      displacement[free[index]] = value;
    });
  }

  const internalForce = globalK.matVec(displacement);
  const residual = internalForce.map((value, index) => value - force[index]);
  const displacements: SolidTetra3DResult['displacements'] = {};
  const reactions: SolidTetra3DResult['reactions'] = {};
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

  let maxVonMisesStress = { element: null as string | null, value: 0 };
  let minSafetyFactor = { element: null as string | null, value: null as number | null };

  const elements = model.elements.map((element) => {
    const state = elementState.get(element.label);
    const location = element.nodes.flatMap((nodeLabel) => dofs.map((dof) => dofIndex.get(`${nodeLabel}:${dof}`))) as number[];
    const elementDisplacement = location.map((index) => displacement[index]);
    const strain = matVecDense(state.strainDisplacement, elementDisplacement) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const stress = matVecDense(state.elasticity, strain) as [number, number, number, number, number, number];
    const vonMisesStress = computeVonMisesStress3D(stress);
    const safetyFactor =
      state.yieldStrength !== undefined && vonMisesStress > 0 ? state.yieldStrength / vonMisesStress : null;

    if (vonMisesStress > maxVonMisesStress.value) {
      maxVonMisesStress = { element: element.label, value: vonMisesStress };
    }

    if (safetyFactor !== null && (minSafetyFactor.value === null || safetyFactor < minSafetyFactor.value)) {
      minSafetyFactor = { element: element.label, value: safetyFactor };
    }

    return {
      label: element.label,
      nodes: element.nodes,
      volume: state.volume,
      centroid: state.centroid,
      strain,
      stress,
      vonMisesStress,
      safetyFactor,
    };
  });

  return {
    displacements,
    reactions,
    elements,
    critical: {
      maxDisplacement,
      maxVonMisesStress,
      minSafetyFactor,
    },
    globalStiffness: globalK.toDense(),
    residualNorm: vectorNorm(residual.filter((_, index) => free.includes(index))),
  };
};
