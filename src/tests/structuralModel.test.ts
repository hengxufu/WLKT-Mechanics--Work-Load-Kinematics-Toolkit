import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_CAPABILITIES,
  activeDofsForAnalysis,
  calculateDeformedNodePosition,
  createEmptyStructuralModel,
  emptyConstraints,
  isResultCurrent,
  migrateLegacyNode,
  structuralMemberDirection,
  structuralMemberLength,
  validateStructuralModel,
} from '@/utils/structuralModel';
import type { StructuralAnalysisModel, StructuralMember, StructuralNode } from '@/types/structuralAnalysis';

const nodes: StructuralNode[] = [
  { id: 'A', x: 0, y: 0, z: 0, constraints: emptyConstraints() },
  { id: 'B', x: 1, y: 2, z: 2, constraints: emptyConstraints() },
];

const member: StructuralMember = {
  id: 'AB',
  type: 'truss3d',
  startNodeId: 'A',
  endNodeId: 'B',
  materialId: 'steel',
  sectionId: 'bar',
};

describe('unified structural model', () => {
  it('migrates legacy planar XZ nodes into XYZ without losing constraints', () => {
    const migrated = migrateLegacyNode(
      { label: 7, coords: [2, 0, -4], bcs: new Set([0, 2, 4]) },
      'planar-frame'
    );
    expect(migrated).toEqual({
      id: '7',
      x: 2,
      y: -4,
      z: 0,
      constraints: {
        ux: true,
        uy: true,
        uz: false,
        rx: false,
        ry: false,
        rz: true,
      },
    });
  });

  it('maps each analysis type to only its active degrees of freedom', () => {
    expect(activeDofsForAnalysis('planar-truss')).toEqual(['ux', 'uy']);
    expect(activeDofsForAnalysis('planar-frame')).toEqual(['ux', 'uy', 'rz']);
    expect(activeDofsForAnalysis('space-truss')).toEqual(['ux', 'uy', 'uz']);
    expect(activeDofsForAnalysis('space-frame')).toEqual(['ux', 'uy', 'uz', 'rx', 'ry', 'rz']);
    expect(ANALYSIS_CAPABILITIES.solid.status).toBe('experimental');
  });

  it('computes spatial member length and direction cosines', () => {
    expect(structuralMemberLength(member, nodes)).toBeCloseTo(3);
    expect(structuralMemberDirection(member, nodes)).toEqual([1 / 3, 2 / 3, 2 / 3]);
  });

  it('calculates true XYZ deformed coordinates', () => {
    expect(calculateDeformedNodePosition(nodes[1], { ux: 0.1, uy: -0.2, uz: 0.3 }, 10)).toEqual({
      x: 2,
      y: 0,
      z: 5,
    });
  });

  it('marks results stale after a model revision changes', () => {
    const model = createEmptyStructuralModel('space-truss');
    expect(isResultCurrent(model, { modelRevision: 0 })).toBe(true);
    model.revision++;
    expect(isResultCurrent(model, { modelRevision: 0 })).toBe(false);
  });

  it('detects zero length, missing properties, and incompatible members', () => {
    const model: StructuralAnalysisModel = {
      ...createEmptyStructuralModel('space-truss'),
      nodes: [
        { id: 'A', x: 0, y: 0, z: 0, constraints: { ...emptyConstraints(), ux: true } },
        { id: 'B', x: 0, y: 0, z: 0, constraints: emptyConstraints() },
      ],
      members: [
        {
          id: 'AB',
          type: 'frame3d',
          startNodeId: 'A',
          endNodeId: 'B',
          materialId: 'missing',
          sectionId: 'missing',
        },
      ],
    };
    const validation = validateStructuralModel(model);
    expect(validation.valid).toBe(false);
    expect(validation.errors.map((item) => item.code)).toEqual(
      expect.arrayContaining(['MEMBER_TYPE_MISMATCH', 'ZERO_LENGTH_MEMBER', 'MISSING_MATERIAL', 'MISSING_SECTION'])
    );
    expect(validation.warnings.map((item) => item.code)).toContain('DUPLICATE_NODE_POSITION');
  });
});
