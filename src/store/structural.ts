import { computed, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import {
  ANALYSIS_CAPABILITIES,
  createEmptyStructuralModel,
  emptyConstraints,
  isResultCurrent,
  validateStructuralModel,
} from '@/utils/structuralModel';
import { solveStructuralAnalysis } from '@/utils/structuralAdapters';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';
import type {
  AnalysisModelType,
  StructuralAnalysisModel,
  StructuralAnalysisResult,
  StructuralMaterial,
  StructuralMember,
  StructuralNodalLoad,
  StructuralNode,
  StructuralSection,
} from '@/types/structuralAnalysis';

const cloneModel = (model: StructuralAnalysisModel): StructuralAnalysisModel => structuredClone(toRaw(model));

export const useStructuralStore = defineStore(
  'structural',
  () => {
    const model = ref<StructuralAnalysisModel>(createEmptyStructuralModel('space-truss'));
    const result = ref<StructuralAnalysisResult | null>(null);
    const selectedNodeId = ref<string | null>(null);
    const selectedMemberId = ref<string | null>(null);

    const capabilities = computed(() => ANALYSIS_CAPABILITIES[model.value.modelType]);
    const validation = computed(() => validateStructuralModel(model.value));
    const resultIsCurrent = computed(() => isResultCurrent(model.value, result.value));
    const resultIsStale = computed(() => Boolean(result.value && !resultIsCurrent.value));

    const mutateModel = (mutate: (draft: StructuralAnalysisModel) => void) => {
      const draft = cloneModel(model.value);
      mutate(draft);
      draft.revision = model.value.revision + 1;
      draft.schemaVersion = model.value.schemaVersion;
      model.value = draft;
    };

    const setAnalysisType = (modelType: AnalysisModelType) => {
      if (model.value.modelType === modelType) return;
      mutateModel((draft) => {
        const isLineModelSwitch =
          (draft.modelType === 'space-truss' || draft.modelType === 'space-frame') &&
          (modelType === 'space-truss' || modelType === 'space-frame');
        draft.modelType = modelType;
        if (isLineModelSwitch) {
          const memberType = modelType === 'space-frame' ? 'frame3d' : 'truss3d';
          for (const member of draft.members) member.type = memberType;
        }
      });
      selectedNodeId.value = null;
      selectedMemberId.value = null;
    };

    const replaceModel = (next: StructuralAnalysisModel) => {
      model.value = cloneModel(next);
      result.value = null;
      selectedNodeId.value = null;
      selectedMemberId.value = null;
    };

    const addNode = (node: StructuralNode) => {
      if (model.value.nodes.some((item) => item.id === node.id)) {
        throw new Error(`节点 "${node.id}" 已存在。`);
      }
      if (
        model.value.nodes.some(
          (item) => Math.hypot(item.x - node.x, item.y - node.y, item.z - node.z) <= 1e-10
        )
      ) {
        throw new Error('该位置已经存在节点，请合并节点或修改坐标。');
      }
      mutateModel((draft) => {
        draft.nodes.push(structuredClone(node));
      });
    };

    const updateNode = (nodeId: string, changes: Partial<Omit<StructuralNode, 'id'>>) => {
      mutateModel((draft) => {
        const node = draft.nodes.find((item) => item.id === nodeId);
        if (!node) throw new Error(`节点 "${nodeId}" 不存在。`);
        Object.assign(node, structuredClone(changes));
      });
    };

    const addMember = (member: StructuralMember) => {
      if (model.value.members.some((item) => item.id === member.id)) {
        throw new Error(`构件 "${member.id}" 已存在。`);
      }
      mutateModel((draft) => {
        draft.members.push(structuredClone(member));
      });
    };

    const addMaterial = (material: StructuralMaterial) => {
      if (model.value.materials.some((item) => item.id === material.id)) {
        throw new Error(`材料 "${material.id}" 已存在。`);
      }
      mutateModel((draft) => {
        draft.materials.push(structuredClone(material));
      });
    };

    const addSection = (section: StructuralSection) => {
      if (model.value.sections.some((item) => item.id === section.id)) {
        throw new Error(`截面 "${section.id}" 已存在。`);
      }
      mutateModel((draft) => {
        draft.sections.push(structuredClone(section));
      });
    };

    const addNodalLoad = (load: StructuralNodalLoad) => {
      if (model.value.nodalLoads.some((item) => item.id === load.id)) {
        throw new Error(`载荷 "${load.id}" 已存在。`);
      }
      mutateModel((draft) => {
        draft.nodalLoads.push(structuredClone(load));
      });
    };

    const solve = () => {
      result.value = solveStructuralAnalysis(model.value);
      return result.value;
    };

    const setResult = (next: StructuralAnalysisResult | null) => {
      result.value = next ? structuredClone(next) : null;
    };

    const invalidateResult = () => {
      mutateModel(() => {});
    };

    const clear = () => {
      const revision = model.value.revision + 1;
      model.value = { ...createEmptyStructuralModel(model.value.modelType), revision };
      result.value = null;
      selectedNodeId.value = null;
      selectedMemberId.value = null;
    };

    const loadSpaceTrussVerificationModel = () => {
      const revision = model.value.revision + 1;
      model.value = {
        ...createEmptyStructuralModel('space-truss'),
        revision,
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
        materials: [
          {
            id: 'steel',
            name: '钢材',
            elasticModulus: 210e9,
            yieldStrength: 235e6,
          },
        ],
        sections: [{ id: 'bar', name: '拉杆截面', area: 0.01 }],
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
      };
      result.value = null;
      selectedNodeId.value = null;
      selectedMemberId.value = null;
    };

    const loadDefaultSpaceFrameExample = () => {
      replaceModel(createDefaultSpaceFrameExample(model.value.revision + 1));
    };

    return {
      model,
      result,
      selectedNodeId,
      selectedMemberId,
      capabilities,
      validation,
      resultIsCurrent,
      resultIsStale,
      setAnalysisType,
      replaceModel,
      mutateModel,
      addNode,
      updateNode,
      addMember,
      addMaterial,
      addSection,
      addNodalLoad,
      solve,
      setResult,
      invalidateResult,
      clear,
      loadSpaceTrussVerificationModel,
      loadDefaultSpaceFrameExample,
    };
  },
  {
    persist: {
      pick: ['model'],
    },
  }
);
