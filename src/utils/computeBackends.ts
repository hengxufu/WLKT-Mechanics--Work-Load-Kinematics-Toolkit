import { solveStructuralAnalysis } from './structuralAdapters';
import { detectWebGPUCapability } from './webgpuCapability';
import type {
  ComputeBackend,
  ComputeSettings,
  SolverProgress,
  StructuralSolveOptions,
  StructuralSolveProblem,
} from '@/types/computeBackend';
import type { StructuralAnalysisResult } from '@/types/structuralAnalysis';
import type { SolverWorkerRequest, SolverWorkerResponse } from '@/workers/solverWorkerProtocol';

interface PendingWorkerTask {
  resolve: (result: StructuralAnalysisResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: SolverProgress) => void;
}

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

export class JavaScriptCpuComputeBackend implements ComputeBackend {
  readonly type = 'cpu' as const;

  async initialize() {
    return Promise.resolve();
  }

  async solve(
    problem: StructuralSolveProblem,
    _options?: StructuralSolveOptions,
    onProgress?: (progress: SolverProgress) => void
  ) {
    onProgress?.({ progress: 0.08, stage: '模型检查' });
    await Promise.resolve();
    onProgress?.({ progress: 0.35, stage: 'CPU 刚度组装' });
    const result = solveStructuralAnalysis(problem.model);
    onProgress?.({ progress: 0.9, stage: 'CPU 结果恢复' });
    return result;
  }

  cancel() {}
  dispose() {}
}

export class WorkerCpuComputeBackend implements ComputeBackend {
  readonly type = 'cpu' as const;
  private worker: Worker | null = null;
  private initialized = false;
  private pending = new Map<string, PendingWorkerTask>();

  async initialize() {
    if (this.initialized && this.worker) return;
    if (typeof Worker === 'undefined') throw new Error('WORKER_UNAVAILABLE');

    const worker = new Worker(new URL('../workers/structuralSolver.worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => this.handleMessage(event.data);
    worker.onerror = (event) => {
      const error = new Error(event.message || 'Solver Worker 运行失败。');
      for (const task of this.pending.values()) task.reject(error);
      this.pending.clear();
    };

    await new Promise<void>((resolve, reject) => {
      const timeout = globalThis.setTimeout(() => reject(new Error('WORKER_INITIALIZE_TIMEOUT')), 5_000);
      const onReady = (event: MessageEvent<SolverWorkerResponse>) => {
        if (event.data.type !== 'ready') return;
        globalThis.clearTimeout(timeout);
        worker.removeEventListener('message', onReady);
        resolve();
      };
      worker.addEventListener('message', onReady);
      const request: SolverWorkerRequest = { type: 'initialize' };
      worker.postMessage(request);
    });
    this.initialized = true;
  }

  async solve(
    problem: StructuralSolveProblem,
    options?: StructuralSolveOptions,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<StructuralAnalysisResult> {
    await this.initialize();
    if (!this.worker) throw new Error('WORKER_NOT_INITIALIZED');
    const taskId = globalThis.crypto?.randomUUID?.() ?? `solve-${Date.now()}-${Math.random()}`;
    const tolerance = options?.tolerance ?? {
      absoluteTolerance: 1e-9,
      relativeTolerance: 1e-7,
      maxIterations: 5_000,
    };

    return new Promise<StructuralAnalysisResult>((resolve, reject) => {
      this.pending.set(taskId, { resolve, reject, onProgress });
      const request: SolverWorkerRequest = {
        type: 'solve',
        taskId,
        model: problem.model,
        tolerance,
      };
      this.worker?.postMessage(request);
    });
  }

  cancel(taskId?: string) {
    if (!this.worker) return;
    if (taskId) {
      const request: SolverWorkerRequest = { type: 'cancel', taskId };
      this.worker.postMessage(request);
      return;
    }

    for (const task of this.pending.values()) task.reject(new Error('SOLVE_CANCELLED'));
    this.pending.clear();
    this.worker.terminate();
    this.worker = null;
    this.initialized = false;
  }

  dispose() {
    if (this.worker) {
      const request: SolverWorkerRequest = { type: 'dispose' };
      this.worker.postMessage(request);
      this.worker.terminate();
    }
    for (const task of this.pending.values()) task.reject(new Error('BACKEND_DISPOSED'));
    this.pending.clear();
    this.worker = null;
    this.initialized = false;
  }

  private handleMessage(response: SolverWorkerResponse) {
    if (response.type === 'ready') return;
    const task = this.pending.get(response.taskId);
    if (!task) return;

    if (response.type === 'progress') {
      task.onProgress?.({ progress: response.progress, stage: response.stage });
      return;
    }

    this.pending.delete(response.taskId);
    if (response.type === 'result') task.resolve(response.result);
    else if (response.type === 'cancelled') task.reject(new Error('SOLVE_CANCELLED'));
    else task.reject(new Error(response.error.message));
  }
}

export class WebGPUComputeBackend implements ComputeBackend {
  readonly type = 'webgpu' as const;
  private initialized = false;

  async initialize() {
    const capability = await detectWebGPUCapability();
    if (!capability.deviceAvailable) throw new Error(capability.message);
    this.initialized = true;
  }

  async solve(): Promise<StructuralAnalysisResult> {
    if (!this.initialized) await this.initialize();
    throw new Error('WEBGPU_NUMERICAL_KERNEL_NOT_IMPLEMENTED');
  }

  cancel() {}

  dispose() {
    this.initialized = false;
  }
}

export class SolverBackendDispatcher {
  private readonly workerCpu = new WorkerCpuComputeBackend();
  private readonly directCpu = new JavaScriptCpuComputeBackend();
  private readonly webgpu = new WebGPUComputeBackend();

  async solve(
    problem: StructuralSolveProblem,
    settings: ComputeSettings,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<StructuralAnalysisResult> {
    const requested = settings.preferredBackend;
    const startedAt = now();
    let fallbackReason: string | undefined;

    if (requested === 'auto' || requested === 'webgpu') {
      const gpu = await detectWebGPUCapability(settings.gpuPowerPreference);
      fallbackReason = gpu.deviceAvailable
        ? 'WebGPU 数值内核尚未完成，本次使用 Worker CPU 高精度求解。'
        : `${gpu.message} 已自动使用 Worker CPU 高精度求解。`;
    }

    const options: StructuralSolveOptions = {
      requestedBackend: requested,
      tolerance: {
        absoluteTolerance: settings.absoluteTolerance,
        relativeTolerance: settings.relativeTolerance,
        maxIterations: settings.maxIterations,
      },
    };

    let result: StructuralAnalysisResult;
    try {
      result = await this.workerCpu.solve(problem, options, onProgress);
    } catch (error) {
      if (error instanceof Error && error.message === 'SOLVE_CANCELLED') throw error;
      const workerReason = error instanceof Error ? error.message : 'Worker 不可用';
      fallbackReason = [fallbackReason, `Solver Worker 不可用（${workerReason}），已回退到主线程 CPU。`]
        .filter(Boolean)
        .join(' ');
      result = await this.directCpu.solve(problem, options, onProgress);
    }

    result.backend = {
      requested,
      actual: 'cpu',
      elapsedMs: now() - startedAt,
      ...(fallbackReason ? { fallbackReason } : {}),
    };
    onProgress?.({ progress: 1, stage: '结果渲染' });
    return result;
  }

  cancel() {
    this.workerCpu.cancel();
    this.directCpu.cancel();
    this.webgpu.cancel();
  }

  dispose() {
    this.workerCpu.dispose();
    this.directCpu.dispose();
    this.webgpu.dispose();
  }
}
