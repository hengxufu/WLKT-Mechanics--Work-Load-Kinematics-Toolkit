import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { reactive } from 'vue';
import {
  JavaScriptCpuComputeBackend,
  SolverBackendDispatcher,
} from '@/utils/computeBackends';
import { clearWebGPUCapabilityCache, detectWebGPUCapability } from '@/utils/webgpuCapability';
import { DEFAULT_COMPUTE_SETTINGS } from '@/types/computeBackend';
import { createEmptyStructuralModel, emptyConstraints } from '@/utils/structuralModel';
import type { SolverProgress } from '@/types/computeBackend';
import type { StructuralAnalysisModel } from '@/types/structuralAnalysis';
import { useSolverStore } from '@/store/solver';

const axialModel = (): StructuralAnalysisModel => ({
  ...createEmptyStructuralModel('space-truss'),
  revision: 2,
  nodes: [
    {
      id: 'A',
      x: 0,
      y: 0,
      z: 0,
      constraints: { ...emptyConstraints(), ux: true, uy: true, uz: true },
    },
    {
      id: 'B',
      x: 2,
      y: 0,
      z: 0,
      constraints: { ...emptyConstraints(), uy: true, uz: true },
    },
  ],
  materials: [{ id: 'steel', name: 'Steel', elasticModulus: 210e9 }],
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

afterEach(() => {
  vi.unstubAllGlobals();
  clearWebGPUCapabilityCache();
});

describe('local compute backends', () => {
  it('solves through the CPU backend and reports progress and convergence', async () => {
    const backend = new JavaScriptCpuComputeBackend();
    const progress: SolverProgress[] = [];
    const result = await backend.solve({ model: axialModel() }, undefined, (next) => progress.push(next));

    expect(progress.map((item) => item.stage)).toContain('CPU 刚度组装');
    expect(result.nodeResults.B.displacement.ux).toBeCloseTo((10_000 * 2) / (210e9 * 0.01));
    expect(result.convergence.converged).toBe(true);
    expect(result.convergence.relativeResidual).toBeLessThan(1e-10);
  });

  it('detects a missing WebGPU API without claiming GPU support', async () => {
    vi.stubGlobal('navigator', {});
    const capability = await detectWebGPUCapability('high-performance', true);
    expect(capability.supported).toBe(false);
    expect(capability.deviceAvailable).toBe(false);
  });

  it('falls back visibly to local main-thread CPU when Worker is unavailable', async () => {
    vi.stubGlobal('Worker', undefined);
    vi.stubGlobal('navigator', {});
    const dispatcher = new SolverBackendDispatcher();
    const result = await dispatcher.solve(
      { model: axialModel() },
      { ...DEFAULT_COMPUTE_SETTINGS, preferredBackend: 'cpu' }
    );

    expect(result.backend.actual).toBe('cpu');
    expect(result.backend.fallbackReason).toMatch(/Worker 不可用/);
    expect(result.diagnostics.errors).toEqual([]);
    dispatcher.dispose();
  });

  it('accepts a reactive Pinia/Vue model at the Worker transfer boundary', async () => {
    vi.stubGlobal('Worker', undefined);
    vi.stubGlobal('navigator', {});
    setActivePinia(createPinia());
    const solverStore = useSolverStore();
    solverStore.settings.preferredBackend = 'cpu';

    const result = await solverStore.solve(reactive(axialModel()));
    expect(result.diagnostics.errors).toEqual([]);
    expect(result.nodeResults.B.displacement.ux).toBeGreaterThan(0);
    solverStore.dispose();
  });
});
