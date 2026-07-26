import { describe, expect, it } from 'vitest';
import {
  computeSolidTetra3DElementStiffness,
  computeSolidTetra3DGeometry,
  computeVonMisesStress3D,
  solveSolidTetra3D,
  type SolidTetraModelInput,
} from '@/utils/solidTetra3D';

const unitTetraCoords = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
] as [number, number, number][];

describe('solidTetra3D', () => {
  it('computes tetra volume and constant shape-function gradients', () => {
    const geometry = computeSolidTetra3DGeometry(unitTetraCoords);

    expect(geometry.volume).toBeCloseTo(1 / 6);
    expect(geometry.centroid).toEqual([0.25, 0.25, 0.25]);
    expect(geometry.gradients[0]).toEqual([-1, -1, -1]);
    expect(geometry.gradients[1]).toEqual([1, 0, 0]);
    expect(geometry.gradients[2]).toEqual([0, 1, 0]);
    expect(geometry.gradients[3]).toEqual([0, 0, 1]);
  });

  it('returns a symmetric element stiffness matrix', () => {
    const { stiffness } = computeSolidTetra3DElementStiffness(unitTetraCoords, 210e9, 0.3);

    for (let row = 0; row < stiffness.length; row++) {
      for (let col = 0; col < stiffness[row].length; col++) {
        expect(stiffness[row][col]).toBeCloseTo(stiffness[col][row]);
      }
    }
  });

  it('recovers uniform strain, stress, and von Mises stress from prescribed displacement', () => {
    const E = 200e9;
    const nu = 0.25;
    const ex = 0.001;
    const ey = 0.002;
    const ez = -0.0005;
    const gxy = 0.0003;
    const gyz = 0.0004;
    const gzx = -0.0002;
    const yieldStrength = 250e6;

    const result = solveSolidTetra3D({
      nodes: [
        { label: 'N1', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'N2', coords: [1, 0, 0], constraints: { x: ex, y: gxy, z: gzx } },
        { label: 'N3', coords: [0, 1, 0], constraints: { x: 0, y: ey, z: gyz } },
        { label: 'N4', coords: [0, 0, 1], constraints: { x: 0, y: 0, z: ez } },
      ],
      elements: [{ label: 'T1', nodes: ['N1', 'N2', 'N3', 'N4'], E, nu, yieldStrength }],
    });

    const element = result.elements[0];
    expect(element.strain[0]).toBeCloseTo(ex);
    expect(element.strain[1]).toBeCloseTo(ey);
    expect(element.strain[2]).toBeCloseTo(ez);
    expect(element.strain[3]).toBeCloseTo(gxy);
    expect(element.strain[4]).toBeCloseTo(gyz);
    expect(element.strain[5]).toBeCloseTo(gzx);
    expect(element.vonMisesStress).toBeCloseTo(computeVonMisesStress3D(element.stress));
    expect(element.safetyFactor).toBeCloseTo(yieldStrength / element.vonMisesStress);
    expect(result.critical.maxVonMisesStress.element).toBe('T1');
    expect(result.critical.minSafetyFactor.element).toBe('T1');
  });

  it('evaluates symbolic material and geometry parameters locally', () => {
    const result = solveSolidTetra3D({
      symbols: {
        L: 1,
        E: 200e9,
        nu: 0.25,
        delta: 0.001,
      },
      nodes: [
        { label: 'N1', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'N2', coords: ['L', 0, 0], constraints: { x: 'delta', y: true, z: true } },
        { label: 'N3', coords: [0, 'L', 0], constraints: { x: true, y: true, z: true } },
        { label: 'N4', coords: [0, 0, 'L'], constraints: { x: true, y: true, z: true } },
      ],
      elements: [{ label: 'T1', nodes: ['N1', 'N2', 'N3', 'N4'], E: 'E', nu: 'nu' }],
    });

    expect(result.elements[0].volume).toBeCloseTo(1 / 6);
    expect(result.elements[0].strain[0]).toBeCloseTo(0.001);
  });

  it('matches dense, sparse-assembly, and sparse-lu backends', () => {
    const model: SolidTetraModelInput = {
      nodes: [
        { label: 'N1', coords: [0, 0, 0], constraints: { x: true, y: true, z: true } },
        { label: 'N2', coords: [1, 0, 0], constraints: { x: 0.001, y: 0.0002, z: true } },
        { label: 'N3', coords: [0, 1, 0], constraints: { x: true, y: 0.0005, z: true } },
        { label: 'N4', coords: [0, 0, 1], constraints: { x: true, y: true, z: -0.0003 } },
      ],
      elements: [{ label: 'T1', nodes: ['N1', 'N2', 'N3', 'N4'], E: 200e9, nu: 0.25 }],
    };
    const dense = solveSolidTetra3D({ ...model, matrixBackend: 'dense' });
    const sparse = solveSolidTetra3D({ ...model, matrixBackend: 'sparse-assembly' });
    const sparseLu = solveSolidTetra3D({ ...model, matrixBackend: 'sparse-lu' });

    expect(sparse.elements[0].vonMisesStress).toBeCloseTo(dense.elements[0].vonMisesStress);
    expect(sparse.reactions.N1[0]).toBeCloseTo(dense.reactions.N1[0]);
    expect(sparseLu.elements[0].vonMisesStress).toBeCloseTo(dense.elements[0].vonMisesStress);
    expect(sparseLu.reactions.N1[0]).toBeCloseTo(dense.reactions.N1[0]);
  });
});
