import { evaluateNumericExpression } from './expression';

export type CombinedDeformationInputKey = 'N' | 'M' | 'T' | 'A' | 'W' | 'Wt' | 'I' | 'J' | 'E' | 'G' | 'L' | 'fy';

export type CombinedDeformationInputs = Record<CombinedDeformationInputKey, string | number>;

export type CombinedDeformationValues = Record<CombinedDeformationInputKey, number>;

export type CombinedDeformationResult = {
  values: CombinedDeformationValues;
  axialStress: number;
  bendingStress: number;
  maxTensileStress: number;
  maxCompressiveStress: number;
  criticalNormalStress: number;
  torsionalShearStress: number;
  vonMisesStress: number;
  utilization: number;
  safetyFactor: number;
  axialStrain: number;
  axialDeformation: number;
  bendingCurvature: number;
  twistAngle: number;
  twistAngleDeg: number;
};

const positiveKeys: CombinedDeformationInputKey[] = ['A', 'W', 'Wt', 'I', 'J', 'E', 'G', 'L', 'fy'];

const evaluateInputs = (
  inputs: CombinedDeformationInputs,
  scope?: Record<string, number>
): CombinedDeformationValues => {
  const values = {} as CombinedDeformationValues;

  for (const key of Object.keys(inputs) as CombinedDeformationInputKey[]) {
    values[key] = evaluateNumericExpression(inputs[key], scope);
  }

  for (const key of positiveKeys) {
    if (!(values[key] > 0)) {
      throw new Error(`${key} must be greater than zero.`);
    }
  }

  return values;
};

export const calculateCombinedDeformation = (
  inputs: CombinedDeformationInputs,
  scope?: Record<string, number>
): CombinedDeformationResult => {
  const values = evaluateInputs(inputs, scope);

  const axialStress = values.N / values.A;
  const bendingStress = values.M / values.W;
  const maxTensileStress = axialStress + Math.abs(bendingStress);
  const maxCompressiveStress = axialStress - Math.abs(bendingStress);
  const criticalNormalStress =
    Math.abs(maxTensileStress) >= Math.abs(maxCompressiveStress) ? maxTensileStress : maxCompressiveStress;
  const torsionalShearStress = values.T / values.Wt;
  const vonMisesStress = Math.sqrt(criticalNormalStress ** 2 + 3 * torsionalShearStress ** 2);
  const utilization = vonMisesStress / values.fy;

  return {
    values,
    axialStress,
    bendingStress,
    maxTensileStress,
    maxCompressiveStress,
    criticalNormalStress,
    torsionalShearStress,
    vonMisesStress,
    utilization,
    safetyFactor: utilization > 0 ? 1 / utilization : Number.POSITIVE_INFINITY,
    axialStrain: axialStress / values.E,
    axialDeformation: (values.N * values.L) / (values.E * values.A),
    bendingCurvature: values.M / (values.E * values.I),
    twistAngle: (values.T * values.L) / (values.G * values.J),
    twistAngleDeg: ((values.T * values.L) / (values.G * values.J)) * (180 / Math.PI),
  };
};

