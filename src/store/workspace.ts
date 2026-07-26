import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { convertPlanarSolverToSpatialModel, inspectSpatialToPlanarConversion, type AddedDofPolicy } from '@/utils/modelDimension';
import { useProjectStore } from './project';
import { useStructuralStore } from './structural';
import { ANALYSIS_CAPABILITIES } from '@/utils/structuralModel';
import type { AnalysisDimension, StructuralProjection, StructuralWorkPlane, ViewportMode } from '@/types/workspace';

export const useWorkspaceStore = defineStore(
  'structural-workspace',
  () => {
    const analysisDimension = ref<AnalysisDimension>('2d');
    const viewportMode = ref<ViewportMode>('2d');
    const activeWorkPlane = ref<StructuralWorkPlane>('xy');
    const projection = ref<StructuralProjection>('perspective');
    const lastSwitchError = ref('');
    const pendingPlanarIssues = ref<string[]>([]);
    const dimensionSwitchCount = ref(0);

    const currentAnalysisLabel = computed(() => {
      if (analysisDimension.value === '2d') return '二维平面刚架';
      return `三维${ANALYSIS_CAPABILITIES[useStructuralStore().model.modelType].label}`;
    });
    const currentViewportLabel = computed(() =>
      viewportMode.value === '2d' ? '二维编辑' : viewportMode.value === '3d' ? '三维编辑' : '二维/三维分屏'
    );

    const setViewportMode = (mode: ViewportMode) => {
      viewportMode.value = mode;
    };

    const switchTo3D = (
      targetType: 'space-truss' | 'space-frame',
      addedDofPolicy: AddedDofPolicy
    ) => {
      lastSwitchError.value = '';
      const project = useProjectStore();
      const structural = useStructuralStore();

      try {
        if (project.solver.domain.nodes.size > 0) {
          structural.replaceModel(
            convertPlanarSolverToSpatialModel(
              project.solver,
              targetType,
              addedDofPolicy,
              structural.model.revision + 1
            )
          );
        } else {
          structural.setAnalysisType(targetType);
          structural.invalidateResult();
        }
        project.solver.loadCases[0].solved = false;
        analysisDimension.value = '3d';
        dimensionSwitchCount.value++;
        return true;
      } catch (error) {
        lastSwitchError.value = error instanceof Error ? error.message : '二维模型转换失败。';
        return false;
      }
    };

    const switchToPreserved3D = () => {
      const structural = useStructuralStore();
      lastSwitchError.value = '';
      if (structural.model.nodes.length === 0) {
        lastSwitchError.value = '本机尚未保存三维模型，请选择转换当前二维模型。';
        return false;
      }
      structural.invalidateResult();
      analysisDimension.value = '3d';
      dimensionSwitchCount.value++;
      return true;
    };

    const startNew3D = (targetType: 'space-truss' | 'space-frame') => {
      const structural = useStructuralStore();
      structural.clear();
      structural.setAnalysisType(targetType);
      analysisDimension.value = '3d';
      lastSwitchError.value = '';
      pendingPlanarIssues.value = [];
      dimensionSwitchCount.value++;
      return true;
    };

    const requestSwitchTo2D = () => {
      const structural = useStructuralStore();
      pendingPlanarIssues.value = inspectSpatialToPlanarConversion(structural.model).map((item) => item.message);
      if (pendingPlanarIssues.value.length > 0) return false;
      return switchTo2DPreservingSpatialModel();
    };

    const switchTo2DPreservingSpatialModel = () => {
      const structural = useStructuralStore();
      structural.invalidateResult();
      analysisDimension.value = '2d';
      pendingPlanarIssues.value = [];
      lastSwitchError.value = '';
      dimensionSwitchCount.value++;
      return true;
    };

    return {
      analysisDimension,
      viewportMode,
      activeWorkPlane,
      projection,
      lastSwitchError,
      pendingPlanarIssues,
      dimensionSwitchCount,
      currentAnalysisLabel,
      currentViewportLabel,
      setViewportMode,
      switchTo3D,
      switchToPreserved3D,
      startNew3D,
      requestSwitchTo2D,
      switchTo2DPreservingSpatialModel,
    };
  },
  {
    persist: {
      pick: ['analysisDimension', 'viewportMode', 'activeWorkPlane', 'projection'],
    },
  }
);
