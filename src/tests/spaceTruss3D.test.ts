import { describe, expect, it } from 'vitest';
import { computeSpaceTruss3DElementStiffness, solveSpaceTruss3D } from '@/utils/spaceTruss3D';

describe('spaceTruss3D', () => {
  it('solves a restrained axial bar against the PL/EA analytical result', () => {
    const result = solveSpaceTruss3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'B', coords: [2, 0, 0], constraints: { y: true, z: true } },
      ],
      materials: [{ label: 'steel', E: 210e9, yieldStrength: 235e6 }],
      sections: [{ label: 'bar', A: 0.01 }],
      elements: [{ label: 'AB', nodes: ['A', 'B'], material: 'steel', section: 'bar' }],
      nodalLoads: [{ node: 'B', values: [10_000, 0, 0] }],
    });

    expect(result.displacements.B[0]).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
    expect(result.reactions.A[0]).toBeCloseTo(-10_000);
    expect(result.elements[0].axialForce).toBeCloseTo(10_000);
    expect(result.elements[0].stress).toBeCloseTo(1_000_000);
    expect(result.elements[0].safetyFactor).toBeCloseTo(235);
  });

  it('computes arbitrary-direction stiffness and axial response from prescribed displacement', () => {
    const directionLength = 3;
    const delta = 0.002;
    const E = 200e9;
    const A = 0.005;
    const expectedAxialForce = (E * A * delta) / directionLength;
    const result = solveSpaceTruss3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        {
          label: 'B',
          coords: [1, 2, 2],
          constraints: {
            x: delta / 3,
            y: (2 * delta) / 3,
            z: (2 * delta) / 3,
          },
        },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E, A }],
      nodalLoads: [],
    });

    expect(result.elements[0].length).toBeCloseTo(directionLength);
    expect(result.elements[0].direction).toEqual([1 / 3, 2 / 3, 2 / 3]);
    expect(result.elements[0].axialForce).toBeCloseTo(expectedAxialForce);
    expect(result.reactions.A[0]).toBeCloseTo(-expectedAxialForce / 3);
    expect(result.reactions.A[1]).toBeCloseTo((-2 * expectedAxialForce) / 3);
    expect(result.reactions.A[2]).toBeCloseTo((-2 * expectedAxialForce) / 3);
  });

  it('returns a symmetric element stiffness matrix', () => {
    const { stiffness } = computeSpaceTruss3DElementStiffness([0, 0, 0], [1, 2, 3], 200e9, 0.01);

    for (let row = 0; row < stiffness.length; row++) {
      for (let col = 0; col < stiffness[row].length; col++) {
        expect(stiffness[row][col]).toBeCloseTo(stiffness[col][row]);
      }
    }
  });

  it('evaluates symbolic model parameters locally', () => {
    const result = solveSpaceTruss3D({
      symbols: {
        L: 2,
        F: 10_000,
        E: 210e9,
        A: 0.01,
      },
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'B', coords: ['L', 0, 0], constraints: { y: true, z: true } },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E: 'E', A: 'A' }],
      nodalLoads: [{ node: 'B', values: ['F', 0, 0] }],
    });

    expect(result.displacements.B[0]).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
  });

  it('matches dense and sparse-assembly backends', () => {
    const model = {
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'B', coords: [2, 0, 0], constraints: { y: true, z: true } },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E: 210e9, A: 0.01 }],
      nodalLoads: [{ node: 'B', values: [10_000, 0, 0] }],
    } as const;
    const dense = solveSpaceTruss3D({ ...model, matrixBackend: 'dense' });
    const sparse = solveSpaceTruss3D({ ...model, matrixBackend: 'sparse-assembly' });

    expect(sparse.displacements.B[0]).toBeCloseTo(dense.displacements.B[0]);
    expect(sparse.reactions.A[0]).toBeCloseTo(dense.reactions.A[0]);
    expect(sparse.elements[0].axialForce).toBeCloseTo(dense.elements[0].axialForce);
  });
});
