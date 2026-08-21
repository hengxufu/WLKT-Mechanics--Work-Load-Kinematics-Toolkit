<script setup lang="ts">
import { computed, ref } from 'vue';
import { useProjectStore } from '@/store/project';
import { useStructuralStore } from '@/store/structural';
import { useWorkspaceStore } from '@/store/workspace';
import type { AnalysisDimension, ViewportMode } from '@/types/workspace';
import type { AddedDofPolicy } from '@/utils/modelDimension';

const projectStore = useProjectStore();
const structuralStore = useStructuralStore();
const workspaceStore = useWorkspaceStore();

const dimensionDialog = ref(false);
const planarWarningDialog = ref(false);
const conversionMode = ref<'convert' | 'preserved' | 'new'>(
  structuralStore.model.nodes.length > 0 ? 'preserved' : 'convert'
);
const targetType = ref<'space-truss' | 'space-frame'>(
  structuralStore.model.modelType === 'space-frame' ? 'space-frame' : 'space-truss'
);
const addedDofPolicy = ref<AddedDofPolicy>('suggest-planar');

const hasPlanarModel = computed(() => projectStore.solver.domain.nodes.size > 0);
const hasPreservedSpatialModel = computed(() => structuralStore.model.nodes.length > 0);
const requestDimension = (dimension: AnalysisDimension) => {
  if (dimension === workspaceStore.analysisDimension) return;
  workspaceStore.lastSwitchError = '';
  if (dimension === '3d') {
    conversionMode.value = hasPreservedSpatialModel.value ? 'preserved' : 'convert';
    dimensionDialog.value = true;
    return;
  }
  if (!workspaceStore.requestSwitchTo2D()) planarWarningDialog.value = true;
};

const confirmThreeDimensionalSwitch = () => {
  const switched =
    conversionMode.value === 'preserved'
      ? workspaceStore.switchToPreserved3D()
      : conversionMode.value === 'new'
        ? workspaceStore.startNew3D(targetType.value)
        : workspaceStore.switchTo3D(targetType.value, addedDofPolicy.value);
  if (switched) dimensionDialog.value = false;
};

const returnToPreservedPlanarModel = () => {
  workspaceStore.switchTo2DPreservingSpatialModel();
  planarWarningDialog.value = false;
};

</script>

<template>
  <div class="analysis-switch" aria-label="分析维度">
    <button :class="{ active: workspaceStore.analysisDimension === '2d' }" type="button" title="二维分析" @click="requestDimension('2d')">2D</button>
    <button :class="{ active: workspaceStore.analysisDimension === '3d' }" type="button" title="三维分析" @click="requestDimension('3d')">3D</button>
    <v-menu v-if="workspaceStore.analysisDimension === '3d' && workspaceStore.viewportMode !== '3d'" location="bottom end">
      <template #activator="{ props }"><button v-bind="props" class="analysis-switch__plane" type="button">{{ workspaceStore.activeWorkPlane.toUpperCase() }}</button></template>
      <v-list density="compact" class="plane-menu"><v-list-item v-for="plane in ['xy', 'xz', 'yz']" :key="plane" :title="`${plane.toUpperCase()} 工作平面`" @click="workspaceStore.activeWorkPlane = plane as 'xy' | 'xz' | 'yz'" /></v-list>
    </v-menu>
  </div>

  <v-dialog v-model="dimensionDialog" max-width="560">
    <v-card>
      <v-card-title>切换到三维分析</v-card-title>
      <v-card-text>
        <v-radio-group v-model="conversionMode" density="compact">
          <v-radio
            value="convert"
            :label="hasPlanarModel ? '复制当前二维模型并转换' : '从空二维工作区创建三维模型'"
          />
          <v-radio
            value="preserved"
            label="打开本地保存的三维模型"
            :disabled="!hasPreservedSpatialModel"
          />
          <v-radio value="new" label="新建空白三维模型（清除已保存的三维副本）" />
        </v-radio-group>

        <template v-if="conversionMode !== 'preserved'">
          <v-select
            v-model="targetType"
            label="三维分析类型"
            density="compact"
            variant="outlined"
            :items="[
              { title: '空间桁架', value: 'space-truss' },
              { title: '空间刚架', value: 'space-frame' },
            ]"
          />
          <v-radio-group
            v-if="conversionMode === 'convert' && hasPlanarModel"
            v-model="addedDofPolicy"
            label="新增空间自由度"
            density="compact"
          >
            <v-radio value="suggest-planar" label="约束出平面自由度，保持原平面力学行为" />
            <v-radio value="free" label="保持新增自由度自由，由我继续补充空间约束" />
          </v-radio-group>
          <v-alert type="info" density="compact" variant="tonal">
            {{
              conversionMode === 'new'
                ? '将新建空白三维模型；原二维模型继续保留在本机。'
                : '转换会创建独立的三维副本，原二维模型继续保留在本机。'
            }}
          </v-alert>
        </template>
        <v-alert
          v-if="workspaceStore.lastSwitchError"
          type="error"
          density="compact"
          variant="tonal"
          class="mt-3"
        >
          {{ workspaceStore.lastSwitchError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dimensionDialog = false">取消</v-btn>
        <v-btn
          color="primary"
          :disabled="
            conversionMode === 'preserved' && !hasPreservedSpatialModel
          "
          @click="confirmThreeDimensionalSwitch"
        >
          切换
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="planarWarningDialog" max-width="560">
    <v-card>
      <v-card-title>三维模型不能无损转成二维</v-card-title>
      <v-card-text>
        <p class="mb-3">检测到以下空间信息。为防止数据丢失，本次不会投影覆盖二维模型：</p>
        <v-list density="compact" lines="one">
          <v-list-item
            v-for="issue in workspaceStore.pendingPlanarIssues"
            :key="issue"
            prepend-icon="mdi-alert-outline"
            :title="issue"
          />
        </v-list>
        <v-alert type="info" density="compact" variant="tonal" class="mt-3">
          可返回原二维模型继续工作；当前三维模型仍完整保存在本机。
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="planarWarningDialog = false">继续三维分析</v-btn>
        <v-btn color="primary" @click="returnToPreservedPlanarModel">返回原二维模型</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.analysis-switch { display: inline-flex; align-items: center; height: 27px; border: 1px solid #4a535f; border-radius: 3px; overflow: hidden; background: #171a1f; }
.analysis-switch > button { min-width: 36px; height: 100%; padding: 0 8px; border: 0; border-right: 1px solid #3c444e; background: transparent; color: #aeb8c4; font: 11px var(--font-mono); cursor: pointer; }
.analysis-switch > button.active { background: rgba(59, 139, 217, 0.24); color: #8ec6f2; box-shadow: inset 0 -2px 0 var(--accent); }
.analysis-switch > button:hover { color: #fff; }
.analysis-switch .analysis-switch__plane { min-width: 34px; border-right: 0; color: var(--warning); }
.plane-menu { min-width: 150px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); }
</style>
