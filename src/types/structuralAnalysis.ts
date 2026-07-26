export type AnalysisModelType = 'planar-truss' | 'planar-frame' | 'space-truss' | 'space-frame' | 'solid';

export type StructuralDof = 'ux' | 'uy' | 'uz' | 'rx' | 'ry' | 'rz';

export type StructuralConstraintSet = Record<StructuralDof, boolean>;

export interface StructuralNode {
  id: string;
  x: number;
  y: number;
  z: number;
  constraints: StructuralConstraintSet;
  prescribedDisplacement?: Partial<Record<StructuralDof, number>>;
}

export type StructuralMemberType = 'truss2d' | 'frame2d' | 'truss3d' | 'frame3d' | 'solid';

export interface StructuralMember {
  id: string;
  type: StructuralMemberType;
  startNodeId?: string;
  endNodeId?: string;
  nodeIds?: string[];
  materialId: string;
  sectionId?: string;
  localAxis?: {
    referenceVector?: { x: number; y: number; z: number };
    rollAngle?: number;
  };
  releases?: {
    start?: Partial<Record<StructuralDof, boolean>>;
    end?: Partial<Record<StructuralDof, boolean>>;
  };
}

export interface StructuralMaterial {
  id: string;
  name: string;
  elasticModulus: number;
  shearModulus?: number;
  poissonRatio?: number;
  density?: number;
  yieldStrength?: number;
}

export interface StructuralSection {
  id: string;
  name: string;
  area: number;
  iy?: number;
  iz?: number;
  torsionConstant?: number;
  shearAreaY?: number;
  shearAreaZ?: number;
}

export interface StructuralNodalLoad {
  id: string;
  nodeId: string;
  force: { x: number; y: number; z: number };
  moment: { x: number; y: number; z: number };
  coordinateSystem: 'global' | 'local';
  loadCaseId: string;
}

export interface StructuralAnalysisModel {
  schemaVersion: number;
  modelType: AnalysisModelType;
  revision: number;
  nodes: StructuralNode[];
  members: StructuralMember[];
  materials: StructuralMaterial[];
  sections: StructuralSection[];
  nodalLoads: StructuralNodalLoad[];
}

export interface AnalysisCapabilities {
  modelType: AnalysisModelType;
  label: string;
  nodeDofs: StructuralDof[];
  memberTypes: StructuralMemberType[];
  supportsBending: boolean;
  supportsTorsion: boolean;
  status: 'available' | 'experimental' | 'planned';
  description: string;
}

export interface SolverValidationIssue {
  code: string;
  message: string;
  entityId?: string;
}

export interface SolverValidationResult {
  valid: boolean;
  errors: SolverValidationIssue[];
  warnings: SolverValidationIssue[];
}

export interface StructuralNodeResult {
  displacement: Partial<Record<StructuralDof, number>>;
  reaction?: Partial<Record<'fx' | 'fy' | 'fz' | 'mx' | 'my' | 'mz', number>>;
}

export interface StructuralMemberStationResult {
  position: number;
  axialForce?: number;
  shearY?: number;
  shearZ?: number;
  torsion?: number;
  bendingY?: number;
  bendingZ?: number;
  normalStress?: number;
  shearStress?: number;
  safetyFactor?: number;
}

export interface StructuralAnalysisResult {
  modelType: AnalysisModelType;
  modelRevision: number;
  backend: {
    requested: 'auto' | 'webgpu' | 'wasm' | 'cpu';
    actual: 'webgpu' | 'wasm' | 'cpu';
    fallbackReason?: string;
    elapsedMs: number;
  };
  convergence: {
    converged: boolean;
    iterations?: number;
    absoluteResidual: number;
    relativeResidual: number;
  };
  nodeResults: Record<string, StructuralNodeResult>;
  memberResults: Record<string, { stations: StructuralMemberStationResult[] }>;
  diagnostics: {
    warnings: string[];
    errors: string[];
  };
}

export interface StructuralSolver<TInput, TRawResult> {
  validate(input: TInput): SolverValidationResult;
  solve(input: TInput): TRawResult;
}

export interface LegacyStructuralNode {
  label?: string | number;
  id?: string | number;
  coords?: readonly number[];
  x?: number;
  y?: number;
  z?: number;
  bcs?: Iterable<number>;
  constraints?: Partial<StructuralConstraintSet>;
}

export interface VersionedProjectFile {
  schemaVersion: number;
  modelType: AnalysisModelType;
  model: StructuralAnalysisModel;
}
