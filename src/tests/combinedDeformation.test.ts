import { describe, expect, it } from 'vitest';
import { calculateCombinedDeformation } from '@/utils/combinedDeformation';

describe('calculateCombinedDeformation', () => {
  it('combines axial, bending, and torsional stresses', () => {
    const result = calculateCombinedDeformation({
      N: 10_000,
      M: 2_000,
      T: 3_000,
      A: 0.01,
      W: 0.001,
      Wt: 0.002,
      I: 1e-5,
      J: 2e-5,
      E: 210e9,
      G: 80e9,
      L: 2,
      fy: 235e6,
    });

    expect(result.axialStress).toBeCloseTo(1e6);
    expect(result.bendingStress).toBeCloseTo(2e6);
    expect(result.criticalNormalStress).toBeCloseTo(3e6);
    expect(result.torsionalShearStress).toBeCloseTo(1.5e6);
    expect(result.vonMisesStress).toBeCloseTo(Math.sqrt(3e6 ** 2 + 3 * 1.5e6 ** 2));
    expect(result.safetyFactor).toBeCloseTo(235e6 / result.vonMisesStress);
  });

  it('evaluates symbolic expressions with a provided scope', () => {
    const result = calculateCombinedDeformation(
      {
        N: '2F',
        M: 'M',
        T: '0.5M',
        A: 'A',
        W: 'W',
        Wt: '2W',
        I: 'I',
        J: '2I',
        E: 'E',
        G: 'G',
        L: 'L',
        fy: 'fy',
      },
      {
        F: 5_000,
        M: 2_000,
        A: 0.01,
        W: 0.001,
        I: 1e-5,
        E: 210e9,
        G: 80e9,
        L: 2,
        fy: 235e6,
      }
    );

    expect(result.values.N).toBeCloseTo(10_000);
    expect(result.values.T).toBeCloseTo(1_000);
    expect(result.values.Wt).toBeCloseTo(0.002);
    expect(result.twistAngle).toBeCloseTo((1_000 * 2) / (80e9 * 2e-5));
  });

  it('rejects non-positive section and material parameters', () => {
    expect(() =>
      calculateCombinedDeformation({
        N: 1,
        M: 1,
        T: 1,
        A: 0,
        W: 1,
        Wt: 1,
        I: 1,
        J: 1,
        E: 1,
        G: 1,
        L: 1,
        fy: 1,
      })
    ).toThrow('A must be greater than zero.');
  });
});
