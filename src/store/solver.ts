import { computed, reactive, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { SolverBackendDispatcher } from '@/utils/computeBackends';
import { detectWebGPUCapability } from '@/utils/webgpuCapability';
import { DEFAULT_COMPUTE_SETTINGS } from '@/types/computeBackend';
import type {
  ComputeBackendStatus,
  ComputeSettings,
  SolverProgress,
  WebGPUCapability,
} from '@/types/computeBackend';
import type { StructuralAnalysisModel } from '@/types/structuralAnalysis';

export const useSolverStore = defineStore(
  'solver-runtime',
  () => {
    const dispatcher = new SolverBackendDispatcher();
    const settings = reactive<ComputeSettings>({ ...DEFAULT_COMPUTE_SETTINGS });
    const capability = ref<WebGPUCapability | null>(null);
    const status = ref<ComputeBackendStatus>({
      requested: 'auto',
      active: 'cpu',
      available: true,
      initialized: false,
    });
    const progress = ref<SolverProgress>({ progress: 0, stage: '等待计算' });
    const isSolving = ref(false);
    const lastError = ref('');
    const lastElapsedMs = ref(0);
    const lastRelativeResidual = ref<number | null>(null);

    const backendLabel = computed(() => {
      if (isSolving.value) return '计算中';
      if (status.value.active === 'webgpu') return '本地 GPU · WebGPU';
      if (status.value.active === 'wasm') return '本地 CPU · WASM';
      return status.value.fallbackReason ? '本地 CPU · 自动回退' : '本地 CPU · Worker';
    });

    const detectCapability = async (forceRefresh = false) => {
      capability.value = await detectWebGPUCapability(settings.gpuPowerPreference, forceRefresh);
      return capability.value;
    };

    const solve = async (model: StructuralAnalysisModel) => {
      isSolving.value = true;
      lastError.value = '';
      progress.value = { progress: 0, stage: '准备计算' };
      status.value = {
        requested: settings.preferredBackend,
        active: 'cpu',
        available: true,
        initialized: true,
      };

      try {
        const transferableModel = structuredClone(toRaw(model));
        const result = await dispatcher.solve({ model: transferableModel }, settings, (next) => {
          progress.value = next;
        });
        status.value = {
          requested: result.backend.requested,
          active: result.backend.actual,
          available: true,
          initialized: true,
          fallbackReason: result.backend.fallbackReason,
        };
        lastElapsedMs.value = result.backend.elapsedMs;
        lastRelativeResidual.value = result.convergence.relativeResidual;
        return result;
      } catch (error) {
        lastError.value = error instanceof Error ? error.message : '结构求解失败。';
        throw error;
      } finally {
        isSolving.value = false;
      }
    };

    const cancel = () => {
      dispatcher.cancel();
      isSolving.value = false;
      progress.value = { progress: 0, stage: '计算已取消' };
    };

    const dispose = () => dispatcher.dispose();

    return {
      settings,
      capability,
      status,
      progress,
      isSolving,
      lastError,
      lastElapsedMs,
      lastRelativeResidual,
      backendLabel,
      detectCapability,
      solve,
      cancel,
      dispose,
    };
  },
  {
    persist: {
      pick: ['settings'],
    },
  }
);
