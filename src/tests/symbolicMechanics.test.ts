import { describe, expect, it } from 'vitest';
import {
  evaluateSymbolicMechanicsExpression,
  evaluateSymbolicMechanicsFormulas,
} from '@/utils/symbolicMechanics';

const mechanicsScope = {
  F: 10000,
  N: 10000,
  M: 2000,
  T: 1000,
  A: 2e-3,
  W: 4e-5,
  Wt: 8e-5,
  I: 8e-6,
  J: 1.6e-5,
  E: 210e9,
  G: 80e9,
  L: 1.5,
  fy: 235e6,
  alpha: 12e-6,
  dT: 35,
};

describe('symbolicMechanics', () => {
  it('evaluates common mechanics formulas from letter symbols', () => {
    expect(evaluateSymbolicMechanicsExpression('F*L^3/(3*E*I)', mechanicsScope)).toBeCloseTo(
      (mechanicsScope.F * mechanicsScope.L ** 3) / (3 * mechanicsScope.E * mechanicsScope.I)
    );
    expect(evaluateSymbolicMechanicsExpression('N/A + M/W', mechanicsScope)).toBeCloseTo(55e6);
    expect(evaluateSymbolicMechanicsExpression('T*L/(G*J)', mechanicsScope)).toBeCloseTo(0.001171875);
  });

  it('evaluates the built-in formula library', () => {
    const rows = evaluateSymbolicMechanicsFormulas(mechanicsScope);
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    expect(byKey.axialStress.value).toBeCloseTo(5e6);
    expect(byKey.bendingStress.value).toBeCloseTo(50e6);
    expect(byKey.axialRigidity.value).toBeCloseTo(420e6);
    expect(byKey.temperatureStress.value).toBeCloseTo(88.2e6);
    expect(byKey.safetyFactor.value).toBeGreaterThan(3);
  });

  it('rejects expressions with undefined letters', () => {
    expect(() => evaluateSymbolicMechanicsExpression('F + unknown', mechanicsScope)).toThrow();
  });
});
