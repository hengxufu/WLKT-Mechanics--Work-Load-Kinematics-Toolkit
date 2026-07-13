import { describe, expect, it } from 'vitest';
import { solveSpaceFrame3D } from '@/utils/spaceFrame3D';
import { solveSpaceTruss3D } from '@/utils/spaceTruss3D';
import { analyzeSpaceFrame3DPostprocess, analyzeSpaceTruss3DPostprocess } from '@/utils/spacePostprocess3D';

const fixedNode = {
  ux: true,
  uy: true,
  uz: true,
  rx: true,
  ry: true,
  rz: true,
};

describe('spacePostprocess3D', () => {
  it('identifies critical frame force, moment, stress, deflection, and safety factor locations', () => {
    const result = solveSpaceFrame3D({
      nodes: [
        { label: 'A', coords: [0, 0, 0], constraints: fixedNode },
        { label: 'B', coords: [2, 0, 0] },
      ],
      materials: [{ label: 'steel', E: 210e9, G: 80e9, yieldStrength: 235e6 }],
      sections: [{ label: 'rect', A: 0.01, Iy: 1e-5, Iz: 2e-5, J: 3e-5, Wy: 2e-4, Wz: 4e-4, Wt: 3e-4 }],
      elements: [{ label: 'AB', nodes: ['A', 'B'], material: 'steel', section: 'rect' }],
      nodalLoads: [{ node: 'B', values: [10_000, 5_000, 0, 2_000, 0, 0] }],
    });
    const analysis = analyzeSpaceFrame3DPostprocess(result, {
      normalStressLimit: 235e6,
      shearStressLimit: 120e6,
    });

    expect(analysis.maxDisplacement?.nodeLabel).toBe('B');
    expect(analysis.maxAxialForce?.value).toBeCloseTo(10_000);
    expect(analysis.maxShearForce?.value).toBeCloseTo(5_000);
    expect(analysis.maxTorque?.value).toBeCloseTo(2_000);
    expect(analysis.maxBendingMoment?.elementLabel).toBe('AB');
    expect(analysis.maxBendingMoment?.position).toBeCloseTo(0);
    expect(analysis.maxNormalStress?.value).toBeGreaterThan(0);
    expect(analysis.maxShearStress?.value).toBeCloseTo((1.5 * 5_000) / 0.01 + 2_000 / 3e-4);
    expect(analysis.minSafetyFactor?.value).toBeCloseTo(235e6 / result.elements[0].maxNormalStress);
    expect(analysis.criticalLocations.length).toBeGreaterThanOrEqual(7);
  });

  it('summarizes truss axial stress and safety factor', () => {
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
    const analysis = analyzeSpaceTruss3DPostprocess(result, { normalStressLimit: 235e6 });

    expect(analysis.maxDisplacement?.nodeLabel).toBe('B');
    expect(analysis.maxAxialForce?.value).toBeCloseTo(10_000);
    expect(analysis.maxNormalStress?.value).toBeCloseTo(1_000_000);
    expect(analysis.maxNormalStress?.ratio).toBeCloseTo(1_000_000 / 235e6);
    expect(analysis.minSafetyFactor?.value).toBeCloseTo(235);
    expect(analysis.maxShearForce).toBeNull();
    expect(analysis.maxBendingMoment).toBeNull();
  });
});
