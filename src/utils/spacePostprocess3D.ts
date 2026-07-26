import type { SpaceFrame3DResult, SpaceFrameElementResult } from './spaceFrame3D';
import type { SpaceTruss3DResult, SpaceTrussElementResult } from './spaceTruss3D';

export type Critical3DKind =
  | 'displacement'
  | 'axialForce'
  | 'shearForce'
  | 'torque'
  | 'bendingMoment'
  | 'normalStress'
  | 'shearStress'
  | 'safetyFactor';

export type CriticalLocation3D = {
  kind: Critical3DKind;
  elementLabel?: string;
  nodeLabel?: string;
  position?: number;
  value: number;
  limit?: number;
  ratio?: number;
  component?: string;
};

export type SpacePostprocess3DResult = {
  maxDisplacement: CriticalLocation3D | null;
  maxAxialForce: CriticalLocation3D | null;
  maxShearForce: CriticalLocation3D | null;
  maxTorque: CriticalLocation3D | null;
  maxBendingMoment: CriticalLocation3D | null;
  maxNormalStress: CriticalLocation3D | null;
  maxShearStress: CriticalLocation3D | null;
  minSafetyFactor: CriticalLocation3D | null;
  criticalLocations: CriticalLocation3D[];
};

export type SpacePostprocess3DOptions = {
  normalStressLimit?: number;
  shearStressLimit?: number;
  deflectionLimitRatio?: number;
};

const abs = Math.abs;

const updateAbsMax = (current: CriticalLocation3D | null, next: CriticalLocation3D) => {
  if (!Number.isFinite(next.value)) return current;
  if (!current) return next;
  return abs(next.value) > abs(current.value) ? next : current;
};

const updateMinPositive = (current: CriticalLocation3D | null, next: CriticalLocation3D) => {
  if (!Number.isFinite(next.value) || next.value <= 0) return current;
  if (!current) return next;
  return next.value < current.value ? next : current;
};

const nodeDisplacementMagnitude3 = (values: [number, number, number]) => Math.hypot(values[0], values[1], values[2]);

const nodeDisplacementMagnitude6 = (values: [number, number, number, number, number, number]) =>
  Math.hypot(values[0], values[1], values[2]);

const endpointPosition = (element: SpaceFrameElementResult, end: 'start' | 'end') => (end === 'start' ? 0 : element.length);

const collectResult = (result: SpacePostprocess3DResult) => {
  return [
    result.maxDisplacement,
    result.maxAxialForce,
    result.maxShearForce,
    result.maxTorque,
    result.maxBendingMoment,
    result.maxNormalStress,
    result.maxShearStress,
    result.minSafetyFactor,
  ].filter((item): item is CriticalLocation3D => Boolean(item));
};

export const analyzeSpaceTruss3DPostprocess = (
  result: SpaceTruss3DResult,
  options: SpacePostprocess3DOptions = {}
): SpacePostprocess3DResult => {
  let maxDisplacement: CriticalLocation3D | null = null;
  let maxAxialForce: CriticalLocation3D | null = null;
  let maxNormalStress: CriticalLocation3D | null = null;
  let minSafetyFactor: CriticalLocation3D | null = null;

  for (const [nodeLabel, displacement] of Object.entries(result.displacements)) {
    const value = nodeDisplacementMagnitude3(displacement);

    maxDisplacement = updateAbsMax(maxDisplacement, {
      kind: 'displacement',
      nodeLabel,
      value,
    });
  }

  for (const element of result.elements) {
    maxAxialForce = updateAbsMax(maxAxialForce, {
      kind: 'axialForce',
      elementLabel: element.label,
      position: 0,
      value: abs(element.axialForce),
      component: 'N',
    });

    maxNormalStress = updateAbsMax(maxNormalStress, {
      kind: 'normalStress',
      elementLabel: element.label,
      position: 0,
      value: abs(element.stress),
      limit: options.normalStressLimit,
      ratio: options.normalStressLimit ? abs(element.stress) / options.normalStressLimit : undefined,
      component: 'sigma',
    });

    if (element.safetyFactor !== null) {
      minSafetyFactor = updateMinPositive(minSafetyFactor, {
        kind: 'safetyFactor',
        elementLabel: element.label,
        position: 0,
        value: element.safetyFactor,
        component: 'sigma',
      });
    }
  }

  const analysis: SpacePostprocess3DResult = {
    maxDisplacement,
    maxAxialForce,
    maxShearForce: null,
    maxTorque: null,
    maxBendingMoment: null,
    maxNormalStress,
    maxShearStress: null,
    minSafetyFactor,
    criticalLocations: [],
  };

  analysis.criticalLocations = collectResult(analysis);
  return analysis;
};

const inspectFrameEndpoint = (
  element: SpaceFrameElementResult,
  endName: 'start' | 'end',
  options: SpacePostprocess3DOptions,
  current: SpacePostprocess3DResult
) => {
  const forces = element.localEndForces[endName];
  const position = endpointPosition(element, endName);
  const axialForce = forces[0];
  const shearForce = Math.hypot(forces[1], forces[2]);
  const torque = forces[3];
  const bendingMoment = Math.hypot(forces[4], forces[5]);

  current.maxAxialForce = updateAbsMax(current.maxAxialForce, {
    kind: 'axialForce',
    elementLabel: element.label,
    position,
    value: abs(axialForce),
    component: 'N',
  });

  current.maxShearForce = updateAbsMax(current.maxShearForce, {
    kind: 'shearForce',
    elementLabel: element.label,
    position,
    value: shearForce,
    component: 'sqrt(Vy^2+Vz^2)',
  });

  current.maxTorque = updateAbsMax(current.maxTorque, {
    kind: 'torque',
    elementLabel: element.label,
    position,
    value: abs(torque),
    component: 'T',
  });

  current.maxBendingMoment = updateAbsMax(current.maxBendingMoment, {
    kind: 'bendingMoment',
    elementLabel: element.label,
    position,
    value: bendingMoment,
    component: 'sqrt(My^2+Mz^2)',
  });

  if (element.maxNormalStress !== null) {
    current.maxNormalStress = updateAbsMax(current.maxNormalStress, {
      kind: 'normalStress',
      elementLabel: element.label,
      position,
      value: element.maxNormalStress,
      limit: options.normalStressLimit,
      ratio: options.normalStressLimit ? abs(element.maxNormalStress) / options.normalStressLimit : undefined,
      component: 'N/A + My/Wy + Mz/Wz',
    });
  }

  if (element.maxShearStress !== null) {
    current.maxShearStress = updateAbsMax(current.maxShearStress, {
      kind: 'shearStress',
      elementLabel: element.label,
      position,
      value: element.maxShearStress,
      limit: options.shearStressLimit,
      ratio: options.shearStressLimit ? abs(element.maxShearStress) / options.shearStressLimit : undefined,
      component: '1.5V/A + T/Wt',
    });
  }

  if (element.safetyFactor !== null) {
    current.minSafetyFactor = updateMinPositive(current.minSafetyFactor, {
      kind: 'safetyFactor',
      elementLabel: element.label,
      position,
      value: element.safetyFactor,
      component: 'normalStress',
    });
  }
};

export const analyzeSpaceFrame3DPostprocess = (
  result: SpaceFrame3DResult,
  options: SpacePostprocess3DOptions = {}
): SpacePostprocess3DResult => {
  const analysis: SpacePostprocess3DResult = {
    maxDisplacement: null,
    maxAxialForce: null,
    maxShearForce: null,
    maxTorque: null,
    maxBendingMoment: null,
    maxNormalStress: null,
    maxShearStress: null,
    minSafetyFactor: null,
    criticalLocations: [],
  };

  for (const [nodeLabel, displacement] of Object.entries(result.displacements)) {
    const value = nodeDisplacementMagnitude6(displacement);

    analysis.maxDisplacement = updateAbsMax(analysis.maxDisplacement, {
      kind: 'displacement',
      nodeLabel,
      value,
    });
  }

  for (const element of result.elements) {
    inspectFrameEndpoint(element, 'start', options, analysis);
    inspectFrameEndpoint(element, 'end', options, analysis);
  }

  analysis.criticalLocations = collectResult(analysis);
  return analysis;
};
