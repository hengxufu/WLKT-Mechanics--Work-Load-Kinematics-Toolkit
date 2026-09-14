import { describe, expect, it } from 'vitest';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';
import { solveStructuralAnalysis } from '@/utils/structuralAdapters';
import { validateStructuralModel } from '@/utils/structuralModel';

describe('default examples', () => {
  it('provides a valid and solvable 3D space-frame example', () => {
    const model = createDefaultSpaceFrameExample(7);
    const validation = validateStructuralModel(model);

    expect(validation.errors).toEqual([]);
    expect(model.modelType).toBe('space-frame');
    expect(model.revision).toBe(7);
    expect(model.nodes).toHaveLength(4);
    expect(model.members).toHaveLength(3);

    const result = solveStructuralAnalysis(model);
    expect(result.convergence.converged).toBe(true);
    expect(result.diagnostics.errors).toEqual([]);
    expect(Object.keys(result.nodeResults)).toEqual(expect.arrayContaining(['A', 'D']));
    expect(Math.abs(result.nodeResults.D.displacement.uz ?? 0)).toBeGreaterThan(0);
  });
});
