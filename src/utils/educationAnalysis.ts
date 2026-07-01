import { Beam2D } from 'ts-fem';
import { useProjectStore } from '@/store/project';

export type CriticalKind = 'normalStress' | 'shearStress' | 'deflection' | 'safety';

export type CriticalResult = {
  kind: CriticalKind;
  elementLabel: string;
  position: number;
  value: number;
  limit?: number;
  ratio?: number;
};

export type CriticalAnalysis = {
  solved: boolean;
  maxNormalStress: CriticalResult | null;
  maxShearStress: CriticalResult | null;
  maxDeflection: CriticalResult | null;
  safetyFactor: CriticalResult | null;
};

export type DerivationElement = {
  label: string;
  startNode: string;
  endNode: string;
  length: number;
  material: string;
  crossSection: string;
  axialRigidity: number;
  bendingRigidity: number;
  maxNormalForce: number;
  maxShearForce: number;
  maxBendingMoment: number;
};

export type BoundaryConditionRow = {
  node: string;
  dx: boolean;
  dz: boolean;
  ry: boolean;
};

export type DerivationSummary = {
  nodeCount: number;
  elementCount: number;
  nodalLoadCount: number;
  elementLoadCount: number;
  prescribedCount: number;
  boundaryRows: BoundaryConditionRow[];
  elements: DerivationElement[];
};

const sampleCount = 32;

const samplePositions = (length: number) => {
  return Array.from({ length: sampleCount + 1 }, (_, index) => (length * index) / sampleCount);
};

const absMax = (values: number[]) => {
  return values.reduce((current, value) => Math.max(current, Math.abs(value)), 0);
};

const getBeamMeta = (beam: Beam2D) => {
  const projectStore = useProjectStore();
  const domain = projectStore.solver.domain;
  const material = domain.materials.get(beam.mat);
  const crossSection = domain.crossSections.get(beam.cs);

  return { material, crossSection };
};

export const buildDerivationSummary = (): DerivationSummary => {
  const projectStore = useProjectStore();
  const solver = projectStore.solver;
  const loadCase = solver.loadCases[0];

  const boundaryRows = [...solver.domain.nodes.values()].map((node) => ({
    node: String(node.label),
    dx: node.bcs.has(0),
    dz: node.bcs.has(2),
    ry: node.bcs.has(4),
  }));

  const elements = projectStore.beams.map((beam) => {
    const { material, crossSection } = getBeamMeta(beam);
    const geo = beam.computeGeo();
    const positions = samplePositions(geo.l);
    const normalForces = loadCase.solved ? positions.map((position) => beam.computeNormalForceAt(loadCase, position)) : [0];
    const shearForces = loadCase.solved ? positions.map((position) => beam.computeShearForceAt(loadCase, position)) : [0];
    const moments = loadCase.solved ? positions.map((position) => beam.computeBendingMomentAt(loadCase, position)) : [0];

    return {
      label: String(beam.label),
      startNode: String(beam.nodes[0]),
      endNode: String(beam.nodes[1]),
      length: geo.l,
      material: String(beam.mat),
      crossSection: String(beam.cs),
      axialRigidity: Number(material?.e ?? 0) * Number(crossSection?.a ?? 0),
      bendingRigidity: Number(material?.e ?? 0) * Number(crossSection?.iy ?? 0),
      maxNormalForce: absMax(normalForces),
      maxShearForce: absMax(shearForces),
      maxBendingMoment: absMax(moments),
    };
  });

  return {
    nodeCount: solver.domain.nodes.size,
    elementCount: solver.domain.elements.size,
    nodalLoadCount: loadCase.nodalLoadList.length,
    elementLoadCount: loadCase.elementLoadList.length,
    prescribedCount: loadCase.prescribedBC.length,
    boundaryRows,
    elements,
  };
};

const updateMax = (current: CriticalResult | null, next: CriticalResult) => {
  if (!current) return next;
  return Math.abs(next.value) > Math.abs(current.value) ? next : current;
};

const updateMinRatio = (current: CriticalResult | null, next: CriticalResult) => {
  if (!current) return next;
  if (next.ratio === undefined) return current;
  if (current.ratio === undefined) return next;
  return next.ratio < current.ratio ? next : current;
};

export const analyzeCriticalSections = (normalStressLimit = 235e6, shearStressLimit = 120e6): CriticalAnalysis => {
  const projectStore = useProjectStore();
  const loadCase = projectStore.solver.loadCases[0];

  let maxNormalStress: CriticalResult | null = null;
  let maxShearStress: CriticalResult | null = null;
  let maxDeflection: CriticalResult | null = null;
  let safetyFactor: CriticalResult | null = null;

  if (!loadCase.solved) {
    return {
      solved: false,
      maxNormalStress,
      maxShearStress,
      maxDeflection,
      safetyFactor,
    };
  }

  for (const beam of projectStore.beams) {
    const { crossSection } = getBeamMeta(beam);
    const geo = beam.computeGeo();
    const area = Math.max(Number(crossSection?.a ?? 0), 1e-12);
    const iy = Math.max(Number(crossSection?.iy ?? 0), 1e-12);
    const halfHeight = Math.max(Number(crossSection?.h ?? 0) / 2, 0);
    const positions = samplePositions(geo.l);

    for (const position of positions) {
      const normalForce = beam.computeNormalForceAt(loadCase, position);
      const shearForce = beam.computeShearForceAt(loadCase, position);
      const bendingMoment = beam.computeBendingMomentAt(loadCase, position);
      const normalStress = Math.abs(normalForce) / area + (halfHeight > 0 ? (Math.abs(bendingMoment) * halfHeight) / iy : 0);
      const shearStress = (1.5 * Math.abs(shearForce)) / area;

      maxNormalStress = updateMax(maxNormalStress, {
        kind: 'normalStress',
        elementLabel: String(beam.label),
        position,
        value: normalStress,
        limit: normalStressLimit,
        ratio: normalStressLimit > 0 ? normalStress / normalStressLimit : undefined,
      });

      maxShearStress = updateMax(maxShearStress, {
        kind: 'shearStress',
        elementLabel: String(beam.label),
        position,
        value: shearStress,
        limit: shearStressLimit,
        ratio: shearStressLimit > 0 ? shearStress / shearStressLimit : undefined,
      });
    }

    const deflection = beam.computeGlobalDefl(loadCase, sampleCount);
    const deflectionLimit = geo.l / 250;

    for (let index = 0; index < deflection.u.length; index++) {
      const position = (geo.l * index) / Math.max(deflection.u.length - 1, 1);
      const value = Math.hypot(Number(deflection.u[index] ?? 0), Number(deflection.w[index] ?? 0));

      maxDeflection = updateMax(maxDeflection, {
        kind: 'deflection',
        elementLabel: String(beam.label),
        position,
        value,
        limit: deflectionLimit,
        ratio: deflectionLimit > 0 ? value / deflectionLimit : undefined,
      });
    }
  }

  for (const item of [maxNormalStress, maxShearStress, maxDeflection]) {
    if (!item || item.ratio === undefined || item.ratio <= 0) continue;

    safetyFactor = updateMinRatio(safetyFactor, {
      kind: 'safety',
      elementLabel: item.elementLabel,
      position: item.position,
      value: 1 / item.ratio,
      limit: item.limit,
      ratio: 1 / item.ratio,
    });
  }

  return {
    solved: true,
    maxNormalStress,
    maxShearStress,
    maxDeflection,
    safetyFactor,
  };
};
