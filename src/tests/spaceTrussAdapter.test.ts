import { describe, expect, it } from 'vitest';
import {
  createSpaceFrameInput,
  createSpaceTrussInput,
  mapSpaceTrussResult,
  solveStructuralAnalysis,
} from '@/utils/structuralAdapters';
import { createEmptyStructuralModel, emptyConstraints, validateStructuralModel } from '@/utils/structuralModel';
import { solveSpaceTruss3D } from '@/utils/spaceTruss3D';
import type { StructuralAnalysisModel } from '@/types/structuralAnalysis';

const axialModel = (): StructuralAnalysisModel => ({
  ...createEmptyStructuralModel('space-truss'),
  revision: 4,
  nodes: [
    {
      id: 'A',
      x: 0,
      y: 0,
      z: 0,
      constraints: { ...emptyConstraints(), ux: true, uy: true, uz: true, rx: true },
    },
    {
      id: 'B',
      x: 2,
      y: 0,
      z: 0,
      constraints: { ...emptyConstraints(), uy: true, uz: true, rz: true },
    },
  ],
  materials: [{ id: 'steel', name: 'Steel', elasticModulus: 210e9, yieldStrength: 235e6 }],
  sections: [{ id: 'bar', name: 'Bar', area: 0.01 }],
  members: [
    {
      id: 'AB',
      type: 'truss3d',
      startNodeId: 'A',
      endNodeId: 'B',
      materialId: 'steel',
      sectionId: 'bar',
    },
  ],
  nodalLoads: [
    {
      id: 'P',
      nodeId: 'B',
      force: { x: 10_000, y: 0, z: 0 },
      moment: { x: 0, y: 0, z: 0 },
      coordinateSystem: 'global',
      loadCaseId: 'LC1',
    },
  ],
});

describe('structural solver adapters', () => {
  it('filters inactive rotational constraints from space truss input', () => {
    const input = createSpaceTrussInput(axialModel());
    expect(input.nodes[0].constraints).toEqual({ x: true, y: true, z: true });
    expect(input.nodes[1].constraints).toEqual({ y: true, z: true });
    expect(input.nodalLoads?.[0].values).toEqual([10_000, 0, 0]);
  });

  it('maps space truss results to a revision-bound unified result', () => {
    const model = axialModel();
    const validation = validateStructuralModel(model);
    const raw = solveSpaceTruss3D(createSpaceTrussInput(model));
    const result = mapSpaceTrussResult(model, raw, validation);
    expect(result.modelRevision).toBe(4);
    expect(result.nodeResults.B.displacement.ux).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
    expect(result.nodeResults.A.reaction?.fx).toBeCloseTo(-10_000);
    expect(result.memberResults.AB.stations[0].axialForce).toBeCloseTo(10_000);
    expect(result.memberResults.AB.stations[0].normalStress).toBeCloseTo(1_000_000);
    expect(result.memberResults.AB.stations[0].shearY).toBeUndefined();
  });

  it('forms a complete space truss solve loop', () => {
    const result = solveStructuralAnalysis(axialModel());
    expect(result.diagnostics.errors).toEqual([]);
    expect(result.nodeResults.B.displacement.ux).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
  });

  it('reports an under-constrained mechanism instead of returning fake results', () => {
    const model = axialModel();
    model.nodes[1].constraints = emptyConstraints();
    model.nodalLoads[0].force = { x: 0, y: 1_000, z: 0 };
    const result = solveStructuralAnalysis(model);
    expect(result.diagnostics.errors[0]).toMatch(/singular|ill-conditioned/i);
    expect(result.nodeResults).toEqual({});
  });

  it('preserves the six-degree ordering in the space frame adapter', () => {
    const model = axialModel();
    model.modelType = 'space-frame';
    model.members[0].type = 'frame3d';
    model.materials[0].shearModulus = 80e9;
    model.sections[0] = {
      id: 'bar',
      name: 'Frame',
      area: 0.01,
      iy: 1e-5,
      iz: 2e-5,
      torsionConstant: 3e-5,
    };
    model.nodalLoads[0].moment = { x: 1, y: 2, z: 3 };
    const input = createSpaceFrameInput(model);
    expect(input.nodalLoads?.[0].values).toEqual([10_000, 0, 0, 1, 2, 3]);
  });
});
