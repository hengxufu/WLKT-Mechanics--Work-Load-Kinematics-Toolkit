import {
  solveSpaceFrame3D,
  type SpaceFrame3DResult,
  type SpaceFrameModelInput,
} from './spaceFrame3D';
import {
  solveSpaceTruss3D,
  type Constraint3D,
  type SpaceTruss3DResult,
  type SpaceTrussModelInput,
} from './spaceTruss3D';
import {
  activeDofsForAnalysis,
  isResultCurrent,
  validateStructuralModel,
} from './structuralModel';
import type {
  SolverValidationResult,
  StructuralAnalysisModel,
  StructuralAnalysisResult,
  StructuralDof,
  StructuralSolver,
} from '@/types/structuralAnalysis';
import type { StructureSceneModel3D } from '@/types/model3d';

const trussDofMap: Record<'ux' | 'uy' | 'uz', keyof Constraint3D> = {
  ux: 'x',
  uy: 'y',
  uz: 'z',
};

const cpuMetadata = (absoluteResidual: number, forceNorm: number, converged = true) => ({
  backend: {
    requested: 'cpu' as const,
    actual: 'cpu' as const,
    elapsedMs: 0,
  },
  convergence: {
    converged,
    absoluteResidual,
    relativeResidual: absoluteResidual / Math.max(forceNorm, Number.EPSILON),
  },
});

const stableVectorNorm = (values: Iterable<number>) => {
  let scale = 0;
  let sumSquares = 1;
  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute === 0) continue;
    if (scale < absolute) {
      const ratio = scale / absolute;
      sumSquares = 1 + sumSquares * ratio * ratio;
      scale = absolute;
    } else {
      const ratio = absolute / scale;
      sumSquares += ratio * ratio;
    }
  }
  return scale === 0 ? 0 : scale * Math.sqrt(sumSquares);
};

const ensureSpaceTruss = (model: StructuralAnalysisModel) => {
  if (model.modelType !== 'space-truss') {
    throw new Error(`Space truss adapter cannot accept model type "${model.modelType}".`);
  }
};

const ensureSpaceFrame = (model: StructuralAnalysisModel) => {
  if (model.modelType !== 'space-frame') {
    throw new Error(`Space frame adapter cannot accept model type "${model.modelType}".`);
  }
};

export const createSpaceTrussInput = (model: StructuralAnalysisModel): SpaceTrussModelInput => {
  ensureSpaceTruss(model);

  return {
    matrixBackend: 'sparse-lu',
    nodes: model.nodes.map((node) => {
      const constraints: Constraint3D = {};
      for (const dof of ['ux', 'uy', 'uz'] as const) {
        const prescribed = node.prescribedDisplacement?.[dof];
        if (prescribed !== undefined) constraints[trussDofMap[dof]] = prescribed;
        else if (node.constraints[dof]) constraints[trussDofMap[dof]] = true;
      }
      return {
        label: node.id,
        coords: [node.x, node.y, node.z],
        constraints,
      };
    }),
    elements: model.members
      .filter((member) => member.type === 'truss3d')
      .map((member) => ({
        label: member.id,
        nodes: [member.startNodeId!, member.endNodeId!] as [string, string],
        material: member.materialId,
        section: member.sectionId,
      })),
    materials: model.materials.map((material) => ({
      label: material.id,
      E: material.elasticModulus,
      yieldStrength: material.yieldStrength,
    })),
    sections: model.sections.map((section) => ({
      label: section.id,
      A: section.area,
    })),
    nodalLoads: model.nodalLoads.map((load) => ({
      node: load.nodeId,
      values: [load.force.x, load.force.y, load.force.z],
    })),
  };
};

export const createSpaceFrameInput = (model: StructuralAnalysisModel): SpaceFrameModelInput => {
  ensureSpaceFrame(model);

  return {
    matrixBackend: 'sparse-lu',
    nodes: model.nodes.map((node) => {
      const constraints: SpaceFrameModelInput['nodes'][number]['constraints'] = {};
      for (const dof of activeDofsForAnalysis('space-frame')) {
        const prescribed = node.prescribedDisplacement?.[dof];
        if (prescribed !== undefined) constraints[dof] = prescribed;
        else if (node.constraints[dof]) constraints[dof] = true;
      }
      return { label: node.id, coords: [node.x, node.y, node.z], constraints };
    }),
    elements: model.members
      .filter((member) => member.type === 'frame3d')
      .map((member) => ({
        label: member.id,
        nodes: [member.startNodeId!, member.endNodeId!] as [string, string],
        material: member.materialId,
        section: member.sectionId,
        localAxisRef: member.localAxis?.referenceVector
          ? [
              member.localAxis.referenceVector.x,
              member.localAxis.referenceVector.y,
              member.localAxis.referenceVector.z,
            ]
          : undefined,
      })),
    materials: model.materials.map((material) => ({
      label: material.id,
      E: material.elasticModulus,
      G:
        material.shearModulus ??
        (material.poissonRatio !== undefined
          ? material.elasticModulus / (2 * (1 + material.poissonRatio))
          : Number.NaN),
      yieldStrength: material.yieldStrength,
    })),
    sections: model.sections.map((section) => ({
      label: section.id,
      A: section.area,
      Iy: section.iy ?? Number.NaN,
      Iz: section.iz ?? Number.NaN,
      J: section.torsionConstant ?? Number.NaN,
    })),
    nodalLoads: model.nodalLoads.map((load) => ({
      node: load.nodeId,
      values: [
        load.force.x,
        load.force.y,
        load.force.z,
        load.moment.x,
        load.moment.y,
        load.moment.z,
      ],
    })),
  };
};

export const mapSpaceTrussResult = (
  model: StructuralAnalysisModel,
  raw: SpaceTruss3DResult,
  validation: SolverValidationResult
): StructuralAnalysisResult => {
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const nodeResults: StructuralAnalysisResult['nodeResults'] = {};

  for (const [nodeId, displacement] of Object.entries(raw.displacements)) {
    const node = nodeById.get(nodeId);
    const reaction = raw.reactions[nodeId];
    nodeResults[nodeId] = {
      displacement: {
        ux: displacement[0],
        uy: displacement[1],
        uz: displacement[2],
      },
      reaction:
        node && reaction
          ? {
              ...(node.constraints.ux || node.prescribedDisplacement?.ux !== undefined ? { fx: reaction[0] } : {}),
              ...(node.constraints.uy || node.prescribedDisplacement?.uy !== undefined ? { fy: reaction[1] } : {}),
              ...(node.constraints.uz || node.prescribedDisplacement?.uz !== undefined ? { fz: reaction[2] } : {}),
            }
          : undefined,
    };
  }

  const memberResults: StructuralAnalysisResult['memberResults'] = {};
  for (const element of raw.elements) {
    const station = {
      axialForce: element.axialForce,
      normalStress: element.stress,
      ...(element.safetyFactor !== null ? { safetyFactor: element.safetyFactor } : {}),
    };
    memberResults[element.label] = {
      stations: [
        { position: 0, ...station },
        { position: 1, ...station },
      ],
    };
  }

  return {
    modelType: 'space-truss',
    modelRevision: model.revision,
    ...cpuMetadata(
      raw.residualNorm,
      stableVectorNorm(model.nodalLoads.flatMap((load) => [load.force.x, load.force.y, load.force.z]))
    ),
    nodeResults,
    memberResults,
    diagnostics: {
      errors: validation.errors.map((item) => item.message),
      warnings: validation.warnings.map((item) => item.message),
    },
  };
};

export const mapSpaceFrameResult = (
  model: StructuralAnalysisModel,
  raw: SpaceFrame3DResult,
  validation: SolverValidationResult
): StructuralAnalysisResult => {
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const nodeResults: StructuralAnalysisResult['nodeResults'] = {};

  for (const [nodeId, displacement] of Object.entries(raw.displacements)) {
    const node = nodeById.get(nodeId);
    const reaction = raw.reactions[nodeId];
    const reactionDofs: Array<[StructuralDof, keyof NonNullable<(typeof nodeResults)[string]['reaction']>, number]> = [
      ['ux', 'fx', 0],
      ['uy', 'fy', 1],
      ['uz', 'fz', 2],
      ['rx', 'mx', 3],
      ['ry', 'my', 4],
      ['rz', 'mz', 5],
    ];
    const mappedReaction: NonNullable<(typeof nodeResults)[string]['reaction']> = {};
    for (const [dof, key, index] of reactionDofs) {
      if (node && (node.constraints[dof] || node.prescribedDisplacement?.[dof] !== undefined)) {
        mappedReaction[key] = reaction[index];
      }
    }
    nodeResults[nodeId] = {
      displacement: {
        ux: displacement[0],
        uy: displacement[1],
        uz: displacement[2],
        rx: displacement[3],
        ry: displacement[4],
        rz: displacement[5],
      },
      reaction: Object.keys(mappedReaction).length > 0 ? mappedReaction : undefined,
    };
  }

  const memberResults: StructuralAnalysisResult['memberResults'] = {};
  for (const element of raw.elements) {
    const toStation = (position: number, values: readonly number[]) => ({
      position,
      axialForce: values[0],
      shearY: values[1],
      shearZ: values[2],
      torsion: values[3],
      bendingY: values[4],
      bendingZ: values[5],
      ...(element.maxNormalStress !== null ? { normalStress: element.maxNormalStress } : {}),
      ...(element.maxShearStress !== null ? { shearStress: element.maxShearStress } : {}),
      ...(element.safetyFactor !== null ? { safetyFactor: element.safetyFactor } : {}),
    });
    memberResults[element.label] = {
      stations: [
        toStation(0, element.localEndForces.start),
        toStation(1, element.localEndForces.end),
      ],
    };
  }

  return {
    modelType: 'space-frame',
    modelRevision: model.revision,
    ...cpuMetadata(
      raw.residualNorm,
      stableVectorNorm(
        model.nodalLoads.flatMap((load) => [
          load.force.x,
          load.force.y,
          load.force.z,
          load.moment.x,
          load.moment.y,
          load.moment.z,
        ])
      )
    ),
    nodeResults,
    memberResults,
    diagnostics: {
      errors: validation.errors.map((item) => item.message),
      warnings: validation.warnings.map((item) => item.message),
    },
  };
};

export class SpaceTrussStructuralSolver
  implements StructuralSolver<SpaceTrussModelInput, SpaceTruss3DResult>
{
  validate(input: SpaceTrussModelInput): SolverValidationResult {
    const errors = [];
    if (input.nodes.length === 0) errors.push({ code: 'NO_NODES', message: '空间桁架没有节点。' });
    if (input.elements.length === 0) errors.push({ code: 'NO_ELEMENTS', message: '空间桁架没有杆件。' });
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  solve(input: SpaceTrussModelInput): SpaceTruss3DResult {
    return solveSpaceTruss3D(input);
  }
}

export class SpaceFrameStructuralSolver
  implements StructuralSolver<SpaceFrameModelInput, SpaceFrame3DResult>
{
  validate(input: SpaceFrameModelInput): SolverValidationResult {
    const errors = [];
    if (input.nodes.length === 0) errors.push({ code: 'NO_NODES', message: '空间刚架没有节点。' });
    if (input.elements.length === 0) errors.push({ code: 'NO_ELEMENTS', message: '空间刚架没有构件。' });
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  solve(input: SpaceFrameModelInput): SpaceFrame3DResult {
    return solveSpaceFrame3D(input);
  }
}

export const solveStructuralAnalysis = (model: StructuralAnalysisModel): StructuralAnalysisResult => {
  const validation = validateStructuralModel(model);
  if (!validation.valid) {
    return {
      modelType: model.modelType,
      modelRevision: model.revision,
      ...cpuMetadata(0, 1, false),
      nodeResults: {},
      memberResults: {},
      diagnostics: {
        errors: validation.errors.map((item) => item.message),
        warnings: validation.warnings.map((item) => item.message),
      },
    };
  }

  try {
    if (model.modelType === 'space-truss') {
      const solver = new SpaceTrussStructuralSolver();
      const input = createSpaceTrussInput(model);
      return mapSpaceTrussResult(model, solver.solve(input), validation);
    }
    if (model.modelType === 'space-frame') {
      const solver = new SpaceFrameStructuralSolver();
      const input = createSpaceFrameInput(model);
      return mapSpaceFrameResult(model, solver.solve(input), validation);
    }
    return {
      modelType: model.modelType,
      modelRevision: model.revision,
      ...cpuMetadata(0, 1, false),
      nodeResults: {},
      memberResults: {},
      diagnostics: {
        errors: [`${model.modelType} 尚未接入统一求解适配层。`],
        warnings: validation.warnings.map((item) => item.message),
      },
    };
  } catch (error) {
    return {
      modelType: model.modelType,
      modelRevision: model.revision,
      ...cpuMetadata(0, 1, false),
      nodeResults: {},
      memberResults: {},
      diagnostics: {
        errors: [error instanceof Error ? error.message : '空间结构求解失败。'],
        warnings: validation.warnings.map((item) => item.message),
      },
    };
  }
};

export const createStructureSceneModelFromStructuralAnalysis = (
  model: StructuralAnalysisModel,
  result: StructuralAnalysisResult | null
): StructureSceneModel3D => {
  const current = isResultCurrent(model, result);
  const resultValue = current ? result : null;
  const dofLabels: Record<StructuralDof, 'Ux' | 'Uy' | 'Uz' | 'Rx' | 'Ry' | 'Rz'> = {
    ux: 'Ux',
    uy: 'Uy',
    uz: 'Uz',
    rx: 'Rx',
    ry: 'Ry',
    rz: 'Rz',
  };

  return {
    coordinateSystem: 'global-xyz',
    nodes: model.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y, z: node.z })),
    members: model.members
      .filter((member) => member.startNodeId && member.endNodeId)
      .map((member) => ({
        id: member.id,
        startNodeId: member.startNodeId!,
        endNodeId: member.endNodeId!,
        materialId: member.materialId,
        sectionId: member.sectionId,
        localAxisRotation: member.localAxis?.rollAngle,
      })),
    nodalLoads: model.nodalLoads.map((load) => ({
      nodeId: load.nodeId,
      force: { ...load.force },
      moment: { ...load.moment },
      coordinateSystem: load.coordinateSystem,
    })),
    distributedLoads: [],
    constraints: model.nodes
      .map((node) => ({
        nodeId: node.id,
        constrainedDofs: activeDofsForAnalysis(model.modelType)
          .filter((dof) => node.constraints[dof] || node.prescribedDisplacement?.[dof] !== undefined)
          .map((dof) => dofLabels[dof]),
      }))
      .filter((constraint) => constraint.constrainedDofs.length > 0),
    displacements: model.nodes.map((node) => {
      const displacement = resultValue?.nodeResults[node.id]?.displacement;
      return {
        nodeId: node.id,
        translation: {
          x: displacement?.ux ?? 0,
          y: displacement?.uy ?? 0,
          z: displacement?.uz ?? 0,
        },
        rotation: {
          x: displacement?.rx ?? 0,
          y: displacement?.ry ?? 0,
          z: displacement?.rz ?? 0,
        },
      };
    }),
    memberForces: Object.entries(resultValue?.memberResults ?? {}).flatMap(([memberId, memberResult]) =>
      memberResult.stations.map((station) => ({
        memberId,
        position: station.position,
        axialForce: station.axialForce ?? 0,
        shearY: station.shearY ?? 0,
        shearZ: station.shearZ ?? 0,
        torsion: station.torsion ?? 0,
        bendingY: station.bendingY ?? 0,
        bendingZ: station.bendingZ ?? 0,
      }))
    ),
    solved: Boolean(resultValue && resultValue.diagnostics.errors.length === 0),
  };
};
