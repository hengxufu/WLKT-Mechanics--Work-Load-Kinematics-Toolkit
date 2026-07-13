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

    for (const matrix of [dense, sparse]) {
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
  });
});
