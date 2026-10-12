import { lusolve, sparse, type Matrix } from 'mathjs';

export type MatrixBackendType = 'dense' | 'sparse-assembly' | 'sparse-lu';

export type LinearSolveOptions = {
  backend?: MatrixBackendType;
  context?: string;
  sparseOrder?: number;
  sparseThreshold?: number;
};

export type GlobalMatrix = {
  readonly size: number;
  readonly backend: MatrixBackendType;
  add(row: number, col: number, value: number): void;
  get(row: number, col: number): number;
  addSubmatrix(location: number[], matrix: number[][]): void;
  matVec(vector: number[]): number[];
  toDense(): number[][];
  toSparseReduced?(indices: number[]): Matrix;
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
  // 稀疏刚度矩阵只保存非零项，键采用“行:列”以避免大模型在组装阶段占用完整 n² 内存。
  private readonly entries = new Map<string, number>();

  constructor(
    readonly size: number,
    readonly backend: Extract<MatrixBackendType, 'sparse-assembly' | 'sparse-lu'> = 'sparse-assembly'
  ) {}

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

  toSparseReduced(indices: number[]) {
    // 将全局自由度重新编号为约化方程的 0..n-1，下游 sparse LU 不需要感知原始编号。
    const reducedIndexByGlobal = new Map(indices.map((globalIndex, reducedIndex) => [globalIndex, reducedIndex]));
    const reduced = sparse();
    reduced.resize([indices.length, indices.length]);

    for (const [key, value] of this.entries) {
      const separator = key.indexOf(':');
      const row = Number(key.slice(0, separator));
      const col = Number(key.slice(separator + 1));
      const reducedRow = reducedIndexByGlobal.get(row);
      const reducedCol = reducedIndexByGlobal.get(col);

      if (reducedRow === undefined || reducedCol === undefined) continue;
      reduced.set([reducedRow, reducedCol], value);
    }

    return reduced;
  }
}

export const createGlobalMatrix = (size: number, backend: MatrixBackendType = 'dense'): GlobalMatrix => {
  if (backend === 'sparse-assembly' || backend === 'sparse-lu') return new SparseAssemblyMatrix(size, backend);
  return new DenseGlobalMatrix(size);
};

const readLinearSolveValues = (answer: unknown, context = 'FEM') => {
  const raw = Array.isArray(answer) ? answer : (answer as { toArray: () => unknown }).toArray();
  const values = (raw as unknown[]).map((row) => (Array.isArray(row) ? Number(row[0]) : Number(row)));

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${context} matrix produced a non-finite solution.`);
  }

  return values;
};

export const solveLinearSystem = (matrix: number[][], rhs: number[], options: LinearSolveOptions = {}) => {
  if (rhs.length === 0) return [];

  let answer: unknown;

  try {
    answer = lusolve(matrix, rhs) as unknown;
  } catch (error) {
    throw new Error(`${options.context ?? 'FEM'} matrix is singular or ill-conditioned: ${error}`);
  }

  return readLinearSolveValues(answer, options.context ?? 'FEM');
};

export const solveSparseLinearSystem = (matrix: Matrix, rhs: number[], options: LinearSolveOptions = {}) => {
  if (rhs.length === 0) return [];

  let answer: unknown;

  try {
    answer = lusolve(matrix, rhs, options.sparseOrder ?? 1, options.sparseThreshold ?? 1) as unknown;
  } catch (error) {
    throw new Error(`${options.context ?? 'FEM'} sparse matrix is singular or ill-conditioned: ${error}`);
  }

  return readLinearSolveValues(answer, options.context ?? 'FEM');
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

  // 已知位移自由度的影响移至右端：Kff * uf = Ff - Kfc * uc。
  // 这同时支持零位移约束和给定位移边界条件，而不是简单删除约束行列。
  const rhs = free.map((row) => force[row] - fixed.reduce((sum, col) => sum + globalK.get(row, col) * displacement[col], 0));

  if (globalK.backend === 'sparse-lu' && globalK.toSparseReduced) {
    // 只有显式选择 sparse-lu 时才保留稀疏形态直到求解，其他后端仍按稠密约化矩阵处理。
    return solveSparseLinearSystem(globalK.toSparseReduced(free), rhs, options);
  }

  const kff = free.map((row) => free.map((col) => globalK.get(row, col)));
  return solveLinearSystem(kff, rhs, options);
};
