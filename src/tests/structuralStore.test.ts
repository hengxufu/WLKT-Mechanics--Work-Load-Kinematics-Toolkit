import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useStructuralStore } from '@/store/structural';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';
import { solveStructuralAnalysis } from '@/utils/structuralAdapters';
import { reactive } from 'vue';

describe('structural store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('can clone and invalidate a model after Vue has made it reactive', () => {
    const store = useStructuralStore();
    store.replaceModel(createDefaultSpaceFrameExample(3));

    expect(store.model.nodes[0].constraints.ux).toBe(true);
    expect(() => store.invalidateResult()).not.toThrow();
    expect(store.model.revision).toBe(4);
    expect(store.model.nodes).toHaveLength(4);
  });

  it('rejects a late solve after another model with the same revision was opened', () => {
    const store = useStructuralStore();
    store.replaceModel(createDefaultSpaceFrameExample(5));
    const pendingResult = solveStructuralAnalysis(store.model);
    store.replaceModel(createDefaultSpaceFrameExample(5));
    expect(store.model.revision).toBe(6);
    expect(store.setResult(pendingResult)).toBe(false);
    expect(store.result).toBeNull();
    store.replaceModel(createDefaultSpaceFrameExample(0));
    expect(store.model.revision).toBe(7);
  });

  it('accepts current reactive results and invalidates them when geometry changes', () => {
    const store = useStructuralStore();
    store.loadDefaultSpaceFrameExample();
    const result = reactive(solveStructuralAnalysis(store.model));
    expect(store.setResult(result)).toBe(true);
    expect(store.resultIsCurrent).toBe(true);
    expect(store.setResult({ ...result, modelType: 'space-truss' })).toBe(false);
    expect(store.result?.modelType).toBe('space-frame');
    store.updateNode('D', { x: 5 });
    expect(store.resultIsStale).toBe(true);
    expect(store.setResult(result)).toBe(false);
  });
});
