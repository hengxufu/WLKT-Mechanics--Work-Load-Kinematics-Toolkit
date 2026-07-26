import { describe, expect, it } from 'vitest';
import {
  analysisDimensionOfModel,
  inspectSpatialToPlanarConversion,
} from '@/utils/modelDimension';
import { createEmptyStructuralModel, emptyConstraints } from '@/utils/structuralModel';
import type { StructuralAnalysisModel } from '@/types/structuralAnalysis';

const spatialModel = (): StructuralAnalysisModel => ({
  ...createEmptyStructuralModel('space-frame'),
  nodes: [
    {
      id: 'A',
      x: 0,
      y: 0,
      z: 1,
      constraints: { ...emptyConstraints(), uz: true, rx: true },
    },
  ],
  nodalLoads: [
    {
      id: 'P',
      nodeId: 'A',
      force: { x: 0, y: 0, z: 10 },
      moment: { x: 5, y: 0, z: 0 },
      coordinateSystem: 'global',
      loadCaseId: 'LC1',
    },
  ],
});

describe('analysis dimension safeguards', () => {
  it('maps model types to their analysis dimension', () => {
    expect(analysisDimensionOfModel('planar-frame')).toBe('2d');
    expect(analysisDimensionOfModel('space-truss')).toBe('3d');
    expect(analysisDimensionOfModel('solid')).toBe('3d');
  });

  it('lists spatial information that would be lost in a planar model', () => {
    const codes = inspectSpatialToPlanarConversion(spatialModel()).map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'NONZERO_Z',
        'OUT_OF_PLANE_FORCE',
        'OUT_OF_PLANE_MOMENT',
        'SPATIAL_CONSTRAINT',
      ])
    );
  });

  it('allows a strictly planar spatial line model to return to the preserved 2D workspace', () => {
    const model = spatialModel();
    model.nodes[0].z = 0;
    model.nodes[0].constraints = emptyConstraints();
    model.nodalLoads[0].force.z = 0;
    model.nodalLoads[0].moment.x = 0;
    expect(inspectSpatialToPlanarConversion(model)).toEqual([]);
  });
});
