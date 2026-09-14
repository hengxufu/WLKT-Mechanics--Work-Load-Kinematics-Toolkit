import type { StructuralAnalysisModel } from '@/types/structuralAnalysis';
import { createEmptyStructuralModel, emptyConstraints } from './structuralModel';

export const createDefaultSpaceFrameExample = (revision = 1): StructuralAnalysisModel => ({
  ...createEmptyStructuralModel('space-frame'),
  revision,
  nodes: [
    {
      id: 'A',
      x: 0,
      y: 0,
      z: 0,
      constraints: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
    },
    { id: 'B', x: 0, y: 0, z: 3, constraints: emptyConstraints() },
    { id: 'C', x: 3, y: 0, z: 3, constraints: emptyConstraints() },
    { id: 'D', x: 3, y: 2, z: 3, constraints: emptyConstraints() },
  ],
  materials: [
    {
      id: 'Q235',
      name: 'Q235 钢材',
      elasticModulus: 210e9,
      shearModulus: 80e9,
      poissonRatio: 0.3,
      yieldStrength: 235e6,
    },
  ],
  sections: [
    {
      id: 'BOX-200',
      name: '箱形截面 200',
      area: 0.018,
      iy: 3.2e-5,
      iz: 5.6e-5,
      torsionConstant: 2.5e-5,
      shearAreaY: 0.015,
      shearAreaZ: 0.015,
    },
  ],
  members: [
    { id: 'AB', type: 'frame3d', startNodeId: 'A', endNodeId: 'B', materialId: 'Q235', sectionId: 'BOX-200' },
    { id: 'BC', type: 'frame3d', startNodeId: 'B', endNodeId: 'C', materialId: 'Q235', sectionId: 'BOX-200' },
    { id: 'CD', type: 'frame3d', startNodeId: 'C', endNodeId: 'D', materialId: 'Q235', sectionId: 'BOX-200' },
  ],
  nodalLoads: [
    {
      id: 'P-D',
      nodeId: 'D',
      force: { x: 8_000, y: -5_000, z: -12_000 },
      moment: { x: 1_800, y: 0, z: 0 },
      coordinateSystem: 'global',
      loadCaseId: 'LC1',
    },
  ],
});
