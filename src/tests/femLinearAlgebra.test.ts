import { describe, expect, it } from 'vitest';
import { createGlobalMatrix, solveReducedSystem } from '@/utils/femLinearAlgebra';

describe('femLinearAlgebra', () => {
  it('assembles dense and sparse matrices to the same values', () => {
    const dense = createGlobalMatrix(3, 'dense');
    const sparse = createGlobalMatrix(3, 'sparse-assembly');
    const location = [0, 2];
    const local = [
      [4, -4],
      [-4, 4],
    ];

    dense.addSubmatrix(location, local);
    sparse.addSubmatrix(location, local);
    dense.add(1, 1, 2);
    sparse.add(1, 1, 2);

    expect(sparse.toDense()).toEqual(dense.toDense());
    expect(sparse.matVec([1, 3, 2])).toEqual(dense.matVec([1, 3, 2]));
  });

  it('solves a reduced system from either matrix backend', () => {
    const dense = createGlobalMatrix(2, 'dense');
    const sparse = createGlobalMatrix(2, 'sparse-assembly');
    const sparseLu = createGlobalMatrix(2, 'sparse-lu');

    for (const matrix of [dense, sparse, sparseLu]) {
      matrix.addSubmatrix(
        [0, 1],
        [
          [10, -10],
          [-10, 10],
        ]
      );
    }

    const force = [0, 5];
    const displacement = [0, 0];
    const free = [1];
    const fixed = [0];

    expect(solveReducedSystem(dense, force, displacement, free, fixed)[0]).toBeCloseTo(0.5);
    expect(solveReducedSystem(sparse, force, displacement, free, fixed)[0]).toBeCloseTo(0.5);
    expect(solveReducedSystem(sparseLu, force, displacement, free, fixed)[0]).toBeCloseTo(0.5);
  });

  it('uses a sparse LU reduced solve without expanding the global matrix to dense form', () => {
    const sparseLu = createGlobalMatrix(4, 'sparse-lu');
    sparseLu.addSubmatrix(
      [0, 1],
      [
        [12, -4],
        [-4, 8],
      ]
    );
    sparseLu.addSubmatrix(
      [1, 3],
      [
        [6, -2],
        [-2, 5],
      ]
    );
    sparseLu.add(2, 2, 9);

    const force = [0, 10, 18, 5];
    const displacement = [0, 0, 0, 0];
    const free = [1, 2, 3];
    const fixed = [0];

    const solution = solveReducedSystem(sparseLu, force, displacement, free, fixed, {
      context: 'test sparse LU',
    });

    expect(solution[0]).toBeCloseTo(0.9090909091);
    expect(solution[1]).toBeCloseTo(2);
    expect(solution[2]).toBeCloseTo(1.3636363636);
  });
});
