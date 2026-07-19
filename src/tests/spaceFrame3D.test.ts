import { describe, expect, it } from 'vitest';
import {
  computeSpaceFrame3DLocalAxes,
  computeSpaceFrame3DLocalStiffness,
  computeSpaceFrame3DTransformation,
  solveSpaceFrame3D,
  transformSpaceFrame3DStiffnessToGlobal,
} from '@/utils/spaceFrame3D';

const fixedNode = {
  ux: true,
  uy: true,
  uz: true,
  rx: true,
  ry: true,
  rz: true,
};

describe('spaceFrame3D', () => {
  it('solves cantilever axial displacement against PL/EA', () => {
    const result = solveSpaceFrame3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: [2, 0, 0] },
      ],
      materials: [{ label: 'steel', E: 210e9, G: 80e9, yieldStrength: 235e6 }],
      sections: [{ label: 'tube', A: 0.01, Iy: 1e-5, Iz: 2e-5, J: 3e-5, Wy: 2e-4, Wz: 4e-4 }],
      elements: [{ label: 'AB', nodes: ['A', 'B'], material: 'steel', section: 'tube' }],
      nodalLoads: [{ node: 'B', values: [10_000, 0, 0, 0, 0, 0] }],
    });

    expect(result.displacements.B[0]).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
    expect(result.reactions.A[0]).toBeCloseTo(-10_000);
    expect(result.elements[0].localEndForces.start[0]).toBeCloseTo(-10_000);
    expect(result.elements[0].localEndForces.end[0]).toBeCloseTo(10_000);
  });

  it('solves cantilever bending about local y against PL^3/(3EIy)', () => {
    const P = 5_000;
    const L = 3;
    const E = 210e9;
    const Iy = 8e-6;
    const result = solveSpaceFrame3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: [L, 0, 0] },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E, G: 80e9, A: 0.01, Iy, Iz: 1e-5, J: 2e-5 }],
      nodalLoads: [{ node: 'B', values: [0, 0, P, 0, 0, 0] }],
    });

    expect(result.displacements.B[2]).toBeCloseTo((P * L ** 3) / (3 * E * Iy));
    expect(result.reactions.A[2]).toBeCloseTo(-P);
    expect(result.reactions.A[4]).toBeCloseTo(P * L);
  });

  it('solves cantilever torsion against TL/GJ', () => {
    const T = 2_000;
    const L = 4;
    const G = 80e9;
    const J = 2e-5;
    const result = solveSpaceFrame3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: [L, 0, 0] },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E: 210e9, G, A: 0.01, Iy: 1e-5, Iz: 1e-5, J }],
      nodalLoads: [{ node: 'B', values: [0, 0, 0, T, 0, 0] }],
    });

    expect(result.displacements.B[3]).toBeCloseTo((T * L) / (G * J));
    expect(result.reactions.A[3]).toBeCloseTo(-T);
    expect(result.elements[0].localEndForces.start[3]).toBeCloseTo(-T);
  });

  it('returns symmetric global stiffness for an arbitrary 3D frame member', () => {
    const axes = computeSpaceFrame3DLocalAxes([0, 0, 0], [1, 2, 3], [0, 0, 1]);
    const local = computeSpaceFrame3DLocalStiffness({
      length: Math.sqrt(14),
      E: 210e9,
      G: 80e9,
      A: 0.01,
      Iy: 1e-5,
      Iz: 2e-5,
      J: 3e-5,
    });
    const transform = computeSpaceFrame3DTransformation(axes);
    const global = transformSpaceFrame3DStiffnessToGlobal(local, transform);

    for (let row = 0; row < global.length; row++) {
      for (let col = 0; col < global[row].length; col++) {
        expect(global[row][col]).toBeCloseTo(global[col][row]);
      }
    }
  });

  it('evaluates symbolic frame parameters locally', () => {
    const result = solveSpaceFrame3D({
      symbols: {
        L: 2,
        F: 10_000,
        E: 210e9,
        G: 80e9,
        A: 0.01,
        Iy: 1e-5,
        Iz: 2e-5,
        J: 3e-5,
      },
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: ['L', 0, 0] },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E: 'E', G: 'G', A: 'A', Iy: 'Iy', Iz: 'Iz', J: 'J' }],
      nodalLoads: [{ node: 'B', values: ['F', 0, 0, 0, 0, 0] }],
    });

    expect(result.displacements.B[0]).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
  });

  it('matches dense, sparse-assembly, and sparse-lu backends', () => {
    const model = {
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: [2, 0, 0] },
      ],
      elements: [{ label: 'AB', nodes: ['A', 'B'], E: 210e9, G: 80e9, A: 0.01, Iy: 1e-5, Iz: 2e-5, J: 3e-5 }],
      nodalLoads: [{ node: 'B', values: [10_000, 5_000, 3_000, 2_000, 0, 0] }],
    } as const;
    const dense = solveSpaceFrame3D({ ...model, matrixBackend: 'dense' });
    const sparse = solveSpaceFrame3D({ ...model, matrixBackend: 'sparse-assembly' });
    const sparseLu = solveSpaceFrame3D({ ...model, matrixBackend: 'sparse-lu' });

    expect(sparse.displacements.B[0]).toBeCloseTo(dense.displacements.B[0]);
    expect(sparse.displacements.B[1]).toBeCloseTo(dense.displacements.B[1]);
    expect(sparse.displacements.B[2]).toBeCloseTo(dense.displacements.B[2]);
    expect(sparse.elements[0].localEndForces.start[0]).toBeCloseTo(dense.elements[0].localEndForces.start[0]);
    expect(sparseLu.displacements.B[0]).toBeCloseTo(dense.displacements.B[0]);
    expect(sparseLu.displacements.B[1]).toBeCloseTo(dense.displacements.B[1]);
    expect(sparseLu.displacements.B[2]).toBeCloseTo(dense.displacements.B[2]);
    expect(sparseLu.elements[0].localEndForces.start[0]).toBeCloseTo(dense.elements[0].localEndForces.start[0]);
  });
});
