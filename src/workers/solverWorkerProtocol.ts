import type { StructuralAnalysisModel, StructuralAnalysisResult } from '@/types/structuralAnalysis';
import type { SolverToleranceOptions } from '@/types/computeBackend';

export type SolverWorkerRequest =
  | { type: 'initialize' }
  | {
      type: 'solve';
      taskId: string;
      model: StructuralAnalysisModel;
      tolerance: SolverToleranceOptions;
    }
  | { type: 'cancel'; taskId: string }
  | { type: 'dispose' };

export type SolverWorkerResponse =
  | { type: 'ready'; backend: 'cpu' }
  | { type: 'progress'; taskId: string; progress: number; stage: string }
  | { type: 'result'; taskId: string; result: StructuralAnalysisResult }
  | { type: 'error'; taskId: string; error: { code: string; message: string } }
  | { type: 'cancelled'; taskId: string };
