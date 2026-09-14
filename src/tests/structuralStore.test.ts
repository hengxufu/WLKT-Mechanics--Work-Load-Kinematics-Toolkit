import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useStructuralStore } from '@/store/structural';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';

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
});
