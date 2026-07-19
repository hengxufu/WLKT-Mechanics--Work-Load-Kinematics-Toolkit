import { evaluateNumericExpression } from './expression';

export type SymbolicMechanicsUnit =
  | 'force'
  | 'moment'
  | 'pressure'
  | 'length'
  | 'angle'
  | 'curvature'
  | 'stiffness'
  | 'dimensionless';

export type SymbolicMechanicsFormulaKey =
  | 'axialStress'
  | 'bendingStress'
  | 'combinedNormalStress'
  | 'torsionalShearStress'
  | 'vonMisesStress'
  | 'axialDeformation'
  | 'cantileverTipDeflection'
  | 'simplySupportedMidspanDeflection'
  | 'twistAngle'
  | 'bendingCurvature'
  | 'axialRigidity'
  | 'bendingRigidity'
  | 'temperatureStress'
  | 'safetyFactor';

export type SymbolicMechanicsFormula = {
  key: SymbolicMechanicsFormulaKey;
  labelKey: string;
  expression: string;
  unit: SymbolicMechanicsUnit;
  descriptionKey: string;
};

export type SymbolicMechanicsFormulaResult = SymbolicMechanicsFormula & {
  value: number;
};

export const symbolicMechanicsFormulas: SymbolicMechanicsFormula[] = [
  {
    key: 'axialStress',
    labelKey: 'education.symbolic.formulas.axialStress',
    expression: 'N / A',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.axialStress',
  },
  {
    key: 'bendingStress',
    labelKey: 'education.symbolic.formulas.bendingStress',
    expression: 'M / W',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.bendingStress',
  },
  {
    key: 'combinedNormalStress',
    labelKey: 'education.symbolic.formulas.combinedNormalStress',
    expression: 'N / A + M / W',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.combinedNormalStress',
  },
  {
    key: 'torsionalShearStress',
    labelKey: 'education.symbolic.formulas.torsionalShearStress',
    expression: 'T / Wt',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.torsionalShearStress',
  },
  {
    key: 'vonMisesStress',
    labelKey: 'education.symbolic.formulas.vonMisesStress',
    expression: 'sqrt((N / A + M / W)^2 + 3 * (T / Wt)^2)',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.vonMisesStress',
  },
  {
    key: 'axialDeformation',
    labelKey: 'education.symbolic.formulas.axialDeformation',
    expression: 'N * L / (E * A)',
    unit: 'length',
    descriptionKey: 'education.symbolic.descriptions.axialDeformation',
  },
  {
    key: 'cantileverTipDeflection',
    labelKey: 'education.symbolic.formulas.cantileverTipDeflection',
    expression: 'F * L^3 / (3 * E * I)',
    unit: 'length',
    descriptionKey: 'education.symbolic.descriptions.cantileverTipDeflection',
  },
  {
    key: 'simplySupportedMidspanDeflection',
    labelKey: 'education.symbolic.formulas.simplySupportedMidspanDeflection',
    expression: 'F * L^3 / (48 * E * I)',
    unit: 'length',
    descriptionKey: 'education.symbolic.descriptions.simplySupportedMidspanDeflection',
  },
  {
    key: 'twistAngle',
    labelKey: 'education.symbolic.formulas.twistAngle',
    expression: 'T * L / (G * J)',
    unit: 'angle',
    descriptionKey: 'education.symbolic.descriptions.twistAngle',
  },
  {
    key: 'bendingCurvature',
    labelKey: 'education.symbolic.formulas.bendingCurvature',
    expression: 'M / (E * I)',
    unit: 'curvature',
    descriptionKey: 'education.symbolic.descriptions.bendingCurvature',
  },
  {
    key: 'axialRigidity',
    labelKey: 'education.symbolic.formulas.axialRigidity',
    expression: 'E * A',
    unit: 'stiffness',
    descriptionKey: 'education.symbolic.descriptions.axialRigidity',
  },
  {
    key: 'bendingRigidity',
    labelKey: 'education.symbolic.formulas.bendingRigidity',
    expression: 'E * I',
    unit: 'moment',
    descriptionKey: 'education.symbolic.descriptions.bendingRigidity',
  },
  {
    key: 'temperatureStress',
    labelKey: 'education.symbolic.formulas.temperatureStress',
    expression: 'E * alpha * dT',
    unit: 'pressure',
    descriptionKey: 'education.symbolic.descriptions.temperatureStress',
  },
  {
    key: 'safetyFactor',
    labelKey: 'education.symbolic.formulas.safetyFactor',
    expression: 'fy / sqrt((N / A + M / W)^2 + 3 * (T / Wt)^2)',
    unit: 'dimensionless',
    descriptionKey: 'education.symbolic.descriptions.safetyFactor',
  },
];

export const evaluateSymbolicMechanicsExpression = (expression: string, scope: Record<string, number>) => {
  return evaluateNumericExpression(expression, scope);
};

export const evaluateSymbolicMechanicsFormulas = (
  scope: Record<string, number>,
  formulas: SymbolicMechanicsFormula[] = symbolicMechanicsFormulas
): SymbolicMechanicsFormulaResult[] => {
  return formulas.map((formula) => ({
    ...formula,
    value: evaluateSymbolicMechanicsExpression(formula.expression, scope),
  }));
};
