import type { StructuralAnalysisModel, StructuralAnalysisResult } from './structuralAnalysis';

export type ComputeBackendType = 'auto' | 'webgpu' | 'wasm' | 'cpu';
export type ActiveComputeBackend = Exclude<ComputeBackendType, 'auto'>;

export interface ComputeBackendStatus {
  requested: ComputeBackendType;
  active: ActiveComputeBackend;
  available: boolean;
  initialized: boolean;
  fallbackReason?: string;
}

export interface SolverToleranceOptions {
  absoluteTolerance: number;
  relativeTolerance: number;
  maxIterations: number;
}

export interface ComputeSettings extends SolverToleranceOptions {
  preferredBackend: 'auto' | 'webgpu' | 'cpu';
  gpuPowerPreference: 'high-performance' | 'low-power';
  precisionMode: 'balanced' | 'high';
  enableCpuVerification: boolean;
}

export interface StructuralSolveProblem {
  model: StructuralAnalysisModel;
}

export interface StructuralSolveOptions {
  requestedBackend: ComputeBackendType;
  tolerance: SolverToleranceOptions;
}

export interface SolverProgress {
  progress: number;
  stage: string;
}

export interface WebGPUCapability {
  supported: boolean;
  adapterAvailable: boolean;
  deviceAvailable: boolean;
  message: string;
  checkedAt: number;
}

export interface ComputeBackend {
  readonly type: ActiveComputeBackend;
  initialize(): Promise<void>;
  solve(
    problem: StructuralSolveProblem,
    options?: StructuralSolveOptions,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<StructuralAnalysisResult>;
  cancel(taskId?: string): void;
  dispose(): void;
}

export const DEFAULT_COMPUTE_SETTINGS: ComputeSettings = {
  preferredBackend: 'auto',
  gpuPowerPreference: 'high-performance',
  precisionMode: 'high',
  enableCpuVerification: true,
  absoluteTolerance: 1e-9,
  relativeTolerance: 1e-7,
  maxIterations: 5_000,
};
