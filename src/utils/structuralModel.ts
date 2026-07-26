import type {
  AnalysisCapabilities,
  AnalysisModelType,
  LegacyStructuralNode,
  SolverValidationIssue,
  SolverValidationResult,
  StructuralAnalysisModel,
  StructuralConstraintSet,
  StructuralDof,
  StructuralMember,
  StructuralNode,
} from '@/types/structuralAnalysis';

export const STRUCTURAL_SCHEMA_VERSION = 2;

export const emptyConstraints = (): StructuralConstraintSet => ({
  ux: false,
  uy: false,
  uz: false,
  rx: false,
  ry: false,
  rz: false,
});

export const ANALYSIS_CAPABILITIES: Record<AnalysisModelType, AnalysisCapabilities> = {
  'planar-truss': {
    modelType: 'planar-truss',
    label: '平面桁架',
    nodeDofs: ['ux', 'uy'],
    memberTypes: ['truss2d'],
    supportsBending: false,
    supportsTorsion: false,
    status: 'planned',
    description: '项目尚无独立平面桁架内核，当前不可求解。',
  },
  'planar-frame': {
    modelType: 'planar-frame',
    label: '平面刚架',
    nodeDofs: ['ux', 'uy', 'rz'],
    memberTypes: ['frame2d'],
    supportsBending: true,
    supportsTorsion: false,
    status: 'available',
    description: '使用现有 ts-fem 二维 Timoshenko 梁系求解器。',
  },
  'space-truss': {
    modelType: 'space-truss',
    label: '空间桁架',
    nodeDofs: ['ux', 'uy', 'uz'],
    memberTypes: ['truss3d'],
    supportsBending: false,
    supportsTorsion: false,
    status: 'available',
    description: '节点具有三个平移自由度，杆件仅承受轴力。',
  },
  'space-frame': {
    modelType: 'space-frame',
    label: '空间刚架',
    nodeDofs: ['ux', 'uy', 'uz', 'rx', 'ry', 'rz'],
    memberTypes: ['frame3d'],
    supportsBending: true,
    supportsTorsion: true,
    status: 'experimental',
    description: '内核支持六自由度和 12x12 梁柱单元，主编辑器接入仍在开发。',
  },
  solid: {
    modelType: 'solid',
    label: '实体模型',
    nodeDofs: ['ux', 'uy', 'uz'],
    memberTypes: ['solid'],
    supportsBending: true,
    supportsTorsion: true,
    status: 'experimental',
    description: '实验性 Tet4 常应变实体内核，尚不提供连续应力云图。',
  },
};

export const activeDofsForAnalysis = (modelType: AnalysisModelType): StructuralDof[] => [
  ...ANALYSIS_CAPABILITIES[modelType].nodeDofs,
];

export const createEmptyStructuralModel = (
  modelType: AnalysisModelType = 'space-truss'
): StructuralAnalysisModel => ({
  schemaVersion: STRUCTURAL_SCHEMA_VERSION,
  modelType,
  revision: 0,
  nodes: [],
  members: [],
  materials: [],
  sections: [],
  nodalLoads: [],
});

export const migrateLegacyNode = (
  node: LegacyStructuralNode,
  modelType: AnalysisModelType = 'planar-frame'
): StructuralNode => {
  const coords = node.coords ?? [];
  const isLegacyPlanar = modelType === 'planar-frame' || modelType === 'planar-truss';
  const x = Number(node.x ?? coords[0] ?? 0);
  const y = Number(node.y ?? (isLegacyPlanar ? coords[2] : coords[1]) ?? 0);
  const z = Number(node.z ?? (isLegacyPlanar ? 0 : coords[2]) ?? 0);
  const constraints = emptyConstraints();

  if (node.constraints) {
    for (const dof of Object.keys(constraints) as StructuralDof[]) {
      constraints[dof] = node.constraints[dof] === true;
    }
  }

  for (const dof of node.bcs ?? []) {
    if (isLegacyPlanar && dof === 0) constraints.ux = true;
    if (isLegacyPlanar && dof === 2) constraints.uy = true;
    if (isLegacyPlanar && dof === 4 && modelType === 'planar-frame') constraints.rz = true;
    if (!isLegacyPlanar && dof === 0) constraints.ux = true;
    if (!isLegacyPlanar && dof === 1) constraints.uy = true;
    if (!isLegacyPlanar && dof === 2) constraints.uz = true;
    if (!isLegacyPlanar && dof === 3) constraints.rx = true;
    if (!isLegacyPlanar && dof === 4) constraints.ry = true;
    if (!isLegacyPlanar && dof === 5) constraints.rz = true;
  }

  const values = [x, y, z];
  if (values.some((value) => !Number.isFinite(value))) throw new Error('Legacy node contains invalid coordinates.');

  return {
    id: String(node.id ?? node.label ?? ''),
    x,
    y,
    z,
    constraints,
  };
};

export const structuralMemberLength = (member: StructuralMember, nodes: StructuralNode[]): number => {
  if (!member.startNodeId || !member.endNodeId) throw new Error(`Member "${member.id}" has no endpoints.`);
  const start = nodes.find((node) => node.id === member.startNodeId);
  const end = nodes.find((node) => node.id === member.endNodeId);
  if (!start || !end) throw new Error(`Member "${member.id}" references an unknown endpoint.`);
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
};

export const structuralMemberDirection = (
  member: StructuralMember,
  nodes: StructuralNode[]
): [number, number, number] => {
  const length = structuralMemberLength(member, nodes);
  if (length <= 1e-12) throw new Error(`Member "${member.id}" has zero length.`);
  const start = nodes.find((node) => node.id === member.startNodeId)!;
  const end = nodes.find((node) => node.id === member.endNodeId)!;
  return [(end.x - start.x) / length, (end.y - start.y) / length, (end.z - start.z) / length];
};

export const calculateDeformedNodePosition = (
  node: StructuralNode,
  displacement: Partial<Record<StructuralDof, number>>,
  scale: number
) => ({
  x: node.x + scale * (displacement.ux ?? 0),
  y: node.y + scale * (displacement.uy ?? 0),
  z: node.z + scale * (displacement.uz ?? 0),
});

const issue = (code: string, message: string, entityId?: string): SolverValidationIssue => ({
  code,
  message,
  entityId,
});

export const validateStructuralModel = (model: StructuralAnalysisModel): SolverValidationResult => {
  const errors: SolverValidationIssue[] = [];
  const warnings: SolverValidationIssue[] = [];
  const capabilities = ANALYSIS_CAPABILITIES[model.modelType];
  const nodeIds = new Set<string>();

  if (model.nodes.length === 0) errors.push(issue('NO_NODES', '模型中没有节点。'));
  if (model.members.length === 0) errors.push(issue('NO_MEMBERS', '模型中没有构件。'));

  for (const node of model.nodes) {
    if (!node.id.trim()) errors.push(issue('EMPTY_NODE_ID', '节点编号不能为空。'));
    if (nodeIds.has(node.id)) errors.push(issue('DUPLICATE_NODE_ID', `节点 "${node.id}" 重复。`, node.id));
    nodeIds.add(node.id);
    if (![node.x, node.y, node.z].every(Number.isFinite)) {
      errors.push(issue('INVALID_NODE_COORDS', `节点 "${node.id}" 坐标无效。`, node.id));
    }
  }

  for (let first = 0; first < model.nodes.length; first++) {
    for (let second = first + 1; second < model.nodes.length; second++) {
      const a = model.nodes[first];
      const b = model.nodes[second];
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= 1e-10) {
        warnings.push(issue('DUPLICATE_NODE_POSITION', `节点 "${a.id}" 与 "${b.id}" 位于同一位置。`, a.id));
      }
    }
  }

  const materialIds = new Set(model.materials.map((material) => material.id));
  const sectionIds = new Set(model.sections.map((section) => section.id));
  const connectedNodes = new Set<string>();

  for (const member of model.members) {
    if (!capabilities.memberTypes.includes(member.type)) {
      errors.push(
        issue(
          'MEMBER_TYPE_MISMATCH',
          `构件 "${member.id}" 类型 ${member.type} 不适用于 ${capabilities.label}。`,
          member.id
        )
      );
    }
    if (!member.startNodeId || !member.endNodeId) {
      errors.push(issue('MISSING_MEMBER_ENDPOINT', `构件 "${member.id}" 缺少端点。`, member.id));
      continue;
    }
    if (!nodeIds.has(member.startNodeId) || !nodeIds.has(member.endNodeId)) {
      errors.push(issue('UNKNOWN_MEMBER_NODE', `构件 "${member.id}" 引用了不存在的节点。`, member.id));
      continue;
    }
    connectedNodes.add(member.startNodeId);
    connectedNodes.add(member.endNodeId);
    if (structuralMemberLength(member, model.nodes) <= 1e-12) {
      errors.push(issue('ZERO_LENGTH_MEMBER', `构件 "${member.id}" 长度为零。`, member.id));
    }
    if (!materialIds.has(member.materialId)) {
      errors.push(issue('MISSING_MATERIAL', `构件 "${member.id}" 缺少有效材料。`, member.id));
    }
    if (member.type !== 'solid' && (!member.sectionId || !sectionIds.has(member.sectionId))) {
      errors.push(issue('MISSING_SECTION', `构件 "${member.id}" 缺少有效截面。`, member.id));
    }
  }

  for (const node of model.nodes) {
    if (!connectedNodes.has(node.id)) warnings.push(issue('FLOATING_NODE', `节点 "${node.id}" 未连接构件。`, node.id));
  }

  if (!model.nodes.some((node) => capabilities.nodeDofs.some((dof) => node.constraints[dof]))) {
    errors.push(issue('NO_CONSTRAINTS', '模型未设置适用于当前分析类型的约束。'));
  }

  if (model.nodalLoads.length === 0) warnings.push(issue('NO_LOADS', '模型未施加载荷。'));

  for (const load of model.nodalLoads) {
    if (!nodeIds.has(load.nodeId)) {
      errors.push(issue('UNKNOWN_LOAD_NODE', `载荷 "${load.id}" 引用了不存在的节点。`, load.id));
    }
    const forceMagnitude = Math.hypot(load.force.x, load.force.y, load.force.z);
    const momentMagnitude = Math.hypot(load.moment.x, load.moment.y, load.moment.z);
    if (forceMagnitude === 0 && momentMagnitude === 0) {
      warnings.push(issue('ZERO_LOAD', `载荷 "${load.id}" 为零向量。`, load.id));
    }
    if (model.modelType === 'space-truss' && momentMagnitude > 0) {
      errors.push(issue('UNSUPPORTED_TRUSS_MOMENT', `空间桁架载荷 "${load.id}" 不能包含力矩。`, load.id));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const nextModelRevision = (model: StructuralAnalysisModel): StructuralAnalysisModel => ({
  ...model,
  revision: model.revision + 1,
});

export const isResultCurrent = (
  model: StructuralAnalysisModel,
  result: { modelRevision: number } | null
): boolean => Boolean(result && result.modelRevision === model.revision);
