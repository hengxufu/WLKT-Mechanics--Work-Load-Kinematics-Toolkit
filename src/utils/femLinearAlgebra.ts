import { lusolve } from 'mathjs';

export type MatrixBackendType = 'dense' | 'sparse-assembly';

export type LinearSolveOptions = {
  backend?: MatrixBackendType;
  context?: string;
};

export type GlobalMatrix = {
  readonly size: number;
  readonly backend: MatrixBackendType;
  add(row: number, col: number, value: number): void;
  get(row: number, col: number): number;
  addSubmatrix(location: number[], matrix: number[][]): void;
  matVec(vector: number[]): number[];
  toDense(): number[][];
};

export const zeroMatrix = (rows: number, cols: number) => {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
};

export const matVecDense = (matrix: number[][], vector: number[]) => {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
};

export class DenseGlobalMatrix implements GlobalMatrix {
  readonly backend = 'dense' as const;
  private readonly values: number[][];

  constructor(readonly size: number) {
    this.values = zeroMatrix(size, size);
  }

  add(row: number, col: number, value: number) {
    this.values[row][col] += value;
  }

  get(row: number, col: number) {
    return this.values[row][col];
  }

  addSubmatrix(location: number[], matrix: number[][]) {
    for (let row = 0; row < location.length; row++) {
      for (let col = 0; col < location.length; col++) {
        this.add(location[row], location[col], matrix[row][col]);
      }
    }
  }

  matVec(vector: number[]) {
    return matVecDense(this.values, vector);
  }

  toDense() {
    return this.values.map((row) => [...row]);
  }
}

export class SparseAssemblyMatrix implements GlobalMatrix {
  readonly backend = 'sparse-assembly' as const;
  private readonly entries = new Map<string, number>();

  constructor(readonly size: number) {}

  add(row: number, col: number, value: number) {
    if (Math.abs(value) <= 0) return;

    const key = `${row}:${col}`;
    const next = (this.entries.get(key) ?? 0) + value;

    if (Math.abs(next) <= 1e-20) {
      this.entries.delete(key);
    } else {
      this.entries.set(key, next);
    }
  }

  get(row: number, col: number) {
    return this.entries.get(`${row}:${col}`) ?? 0;
  }

  addSubmatrix(location: number[], matrix: number[][]) {
    for (let row = 0; row < location.length; row++) {
      for (let col = 0; col < location.length; col++) {
        this.add(location[row], location[col], matrix[row][col]);
      }
    }
  }

  matVec(vector: number[]) {
    const result = Array.from({ length: this.size }, () => 0);

    for (const [key, value] of this.entries) {
      const separator = key.indexOf(':');
      const row = Number(key.slice(0, separator));
      const col = Number(key.slice(separator + 1));
      result[row] += value * vector[col];
    }

    return result;
  }

  toDense() {
    const dense = zeroMatrix(this.size, this.size);

    for (const [key, value] of this.entries) {
      const separator = key.indexOf(':');
      const row = Number(key.slice(0, separator));
      const col = Number(key.slice(separator + 1));
      dense[row][col] = value;
    }

    return dense;
  }
}

export const createGlobalMatrix = (size: number, backend: MatrixBackendType = 'dense'): GlobalMatrix => {
  if (backend === 'sparse-assembly') return new SparseAssemblyMatrix(size);
  return new DenseGlobalMatrix(size);
};

export const solveLinearSystem = (matrix: number[][], rhs: number[], options: LinearSolveOptions = {}) => {
  if (rhs.length === 0) return [];

  let answer: unknown;

  try {
    answer = lusolve(matrix, rhs) as unknown;
  } catch (error) {
    throw new Error(`${options.context ?? 'FEM'} matrix is singular or ill-conditioned: ${error}`);
  }

  const raw = Array.isArray(answer) ? answer : (answer as { toArray: () => unknown }).toArray();
  const values = (raw as unknown[]).map((row) => (Array.isArray(row) ? Number(row[0]) : Number(row)));

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${options.context ?? 'FEM'} matrix produced a non-finite solution.`);
  }

  return values;
};

export const solveReducedSystem = (
  globalK: GlobalMatrix,
  force: number[],
  displacement: number[],
  free: number[],
  fixed: number[],
  options: LinearSolveOptions = {}
) => {
  if (free.length === 0) return [];

  const kff = free.map((row) => free.map((col) => globalK.get(row, col)));
  const rhs = free.map((row) => force[row] - fixed.reduce((sum, col) => sum + globalK.get(row, col) * displacement[col], 0));

  return solveLinearSystem(kff, rhs, options);
};
