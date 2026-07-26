import type { AnalysisModelType } from './structuralAnalysis';

export type AnalysisDimension = '2d' | '3d';
export type ViewportMode = '2d' | '3d' | 'split';
export type StructuralWorkPlane = 'xy' | 'xz' | 'yz';
export type StructuralProjection = 'orthographic' | 'perspective';

export interface StructuralViewState {
  viewportMode: ViewportMode;
  activeWorkPlane: StructuralWorkPlane;
  projection: StructuralProjection;
  showGrid: boolean;
  showGlobalAxes: boolean;
  showLocalAxes: boolean;
  deformationScale: number | 'auto';
}

export const analysisDimensionForType = (modelType: AnalysisModelType): AnalysisDimension =>
  modelType === 'planar-truss' || modelType === 'planar-frame' ? '2d' : '3d';

export const viewportModeLabel: Record<ViewportMode, string> = {
  '2d': '二维',
  '3d': '三维',
  split: '分屏',
};
