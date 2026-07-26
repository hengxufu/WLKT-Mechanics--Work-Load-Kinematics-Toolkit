/// <reference lib="webworker" />

import { solveStructuralAnalysis } from '@/utils/structuralAdapters';
import type { SolverWorkerRequest, SolverWorkerResponse } from './solverWorkerProtocol';

const cancelledTasks = new Set<string>();
const send = (message: SolverWorkerResponse) => self.postMessage(message);

const progress = (taskId: string, value: number, stage: string) => {
  send({ type: 'progress', taskId, progress: value, stage });
};

self.onmessage = (event: MessageEvent<SolverWorkerRequest>) => {
  const request = event.data;

  if (request.type === 'initialize') {
    send({ type: 'ready', backend: 'cpu' });
    return;
  }

  if (request.type === 'cancel') {
    cancelledTasks.add(request.taskId);
    send({ type: 'cancelled', taskId: request.taskId });
    return;
  }

  if (request.type === 'dispose') {
    cancelledTasks.clear();
    self.close();
    return;
  }

  const { taskId, model } = request;
  try {
    progress(taskId, 0.08, '模型检查');
    if (cancelledTasks.has(taskId)) {
      send({ type: 'cancelled', taskId });
      return;
    }

    progress(taskId, 0.2, '自由度编号');
    progress(taskId, 0.38, '单元矩阵与总刚度组装');
    const result = solveStructuralAnalysis(model);
    progress(taskId, 0.76, '线性方程求解与残差验证');

    if (cancelledTasks.has(taskId)) {
      send({ type: 'cancelled', taskId });
      return;
    }

    progress(taskId, 0.9, '内力与应力恢复');
    send({ type: 'result', taskId, result });
  } catch (error) {
    send({
      type: 'error',
      taskId,
      error: {
        code: 'WORKER_SOLVE_FAILED',
        message: error instanceof Error ? error.message : 'Worker 求解失败。',
      },
    });
  } finally {
    cancelledTasks.delete(taskId);
  }
};
