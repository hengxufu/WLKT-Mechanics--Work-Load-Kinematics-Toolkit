import { Beam2D, DofID, type LinearStaticSolver } from 'ts-fem';
import { createEmptyStructuralModel, emptyConstraints } from './structuralModel';
import type {
  AnalysisModelType,
  StructuralAnalysisModel,
  StructuralConstraintSet,
} from '@/types/structuralAnalysis';

export type AddedDofPolicy = 'free' | 'suggest-planar';

const mapPlanarConstraints = (
  bcs: ReadonlySet<number>,
  targetType: 'space-truss' | 'space-frame',
  policy: AddedDofPolicy
): StructuralConstraintSet => {
  const constraints = emptyConstraints();
  constraints.ux = bcs.has(DofID.Dx);
  constraints.uy = bcs.has(DofID.Dz);
  if (targetType === 'space-frame') constraints.rz = bcs.has(DofID.Ry);

  if (policy === 'suggest-planar') {
    constraints.uz = true;
    if (targetType === 'space-frame') {
      constraints.rx = true;
      constraints.ry = true;
    }
  }
  return constraints;
};

export const convertPlanarSolverToSpatialModel = (
  solver: LinearStaticSolver,
  targetType: 'space-truss' | 'space-frame',
  addedDofPolicy: AddedDofPolicy,
  revision: number
): StructuralAnalysisModel => {
  const loadCase = solver.loadCases[0];
  if (loadCase.elementLoadList.length > 0) {
    throw new Error('当前二维模型包含构件荷载，空间求解器尚不支持该载荷，已取消转换。');
  }
  if (loadCase.prescribedBC.length > 0) {
    throw new Error('当前二维模型包含指定节点位移，空间转换尚未支持该数据，已取消转换。');
  }
  if (
    targetType === 'space-truss' &&
    loadCase.nodalLoadList.some((load) =>
      [DofID.Rx, DofID.Ry, DofID.Rz].some((dof) => Math.abs(Number(load.values[dof] ?? 0)) > 1e-12)
    )
  ) {
    throw new Error('当前二维模型包含节点力矩，不能转换为空间桁架；请选择空间刚架。');
  }

  const model = createEmptyStructuralModel(targetType);
  model.revision = revision;
  model.nodes = [...solver.domain.nodes.values()].map((node) => ({
    id: node.label,
    x: Number(node.coords[0] ?? 0),
    y: Number(node.coords[2] ?? 0),
    z: 0,
    constraints: mapPlanarConstraints(node.bcs, targetType, addedDofPolicy),
  }));
  model.materials = [...solver.domain.materials.values()].map((material) => ({
    id: material.label,
    name: `材料 ${material.label}`,
    elasticModulus: material.e,
    shearModulus: material.g,
    density: material.d,
  }));
  model.sections = [...solver.domain.crossSections.values()].map((section) => ({
    id: section.label,
    name: `截面 ${section.label}`,
    area: section.a,
    iy: section.iy,
    iz: section.iz,
    torsionConstant: section.j,
  }));
  model.members = [...solver.domain.elements.values()]
    .filter((element): element is Beam2D => element instanceof Beam2D)
    .map((element) => ({
      id: element.label,
      type: targetType === 'space-truss' ? 'truss3d' : 'frame3d',
      startNodeId: element.nodes[0],
      endNodeId: element.nodes[1],
      materialId: element.mat,
      sectionId: element.cs,
    }));
  model.nodalLoads = loadCase.nodalLoadList.map((load, index) => ({
    id: `N${index + 1}`,
    nodeId: String(load.target),
    force: {
      x: Number(load.values[DofID.Dx] ?? 0),
      y: Number(load.values[DofID.Dz] ?? 0),
      z: Number(load.values[DofID.Dy] ?? 0),
    },
    moment: {
      x: Number(load.values[DofID.Rx] ?? 0),
      y: Number(load.values[DofID.Rz] ?? 0),
      z: Number(load.values[DofID.Ry] ?? 0),
    },
    coordinateSystem: 'global',
    loadCaseId: 'LC1',
  }));
  return model;
};

export interface DimensionConversionIssue {
  code: string;
  message: string;
}

export const inspectSpatialToPlanarConversion = (
  model: StructuralAnalysisModel
): DimensionConversionIssue[] => {
  const issues: DimensionConversionIssue[] = [];
  if (model.modelType === 'solid') {
    issues.push({ code: 'SOLID_MODEL', message: '实体单元不能转换为二维杆系。' });
  }
  if (model.nodes.some((node) => Math.abs(node.z) > 1e-10)) {
    issues.push({ code: 'NONZERO_Z', message: '存在非零 Z 坐标。' });
  }
  if (model.nodalLoads.some((load) => Math.abs(load.force.z) > 1e-10)) {
    issues.push({ code: 'OUT_OF_PLANE_FORCE', message: '存在 Fz 空间荷载。' });
  }
  if (model.nodalLoads.some((load) => Math.hypot(load.moment.x, load.moment.y) > 1e-10)) {
    issues.push({ code: 'OUT_OF_PLANE_MOMENT', message: '存在 Mx 或 My 空间力矩。' });
  }
  if (
    model.nodes.some(
      (node) =>
        node.constraints.uz ||
        node.constraints.rx ||
        node.constraints.ry ||
        node.prescribedDisplacement?.uz !== undefined ||
        node.prescribedDisplacement?.rx !== undefined ||
        node.prescribedDisplacement?.ry !== undefined
    )
  ) {
    issues.push({ code: 'SPATIAL_CONSTRAINT', message: '存在二维模型不支持的 Uz、Rx 或 Ry 约束。' });
  }
  if (model.members.some((member) => member.localAxis?.referenceVector || member.localAxis?.rollAngle)) {
    issues.push({ code: 'LOCAL_AXIS', message: '存在空间局部坐标轴定义。' });
  }
  return issues;
};

export const analysisDimensionOfModel = (modelType: AnalysisModelType) =>
  modelType === 'planar-frame' || modelType === 'planar-truss' ? '2d' : '3d';
