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
const statusText = computed(
  () => `${workspaceStore.currentAnalysisLabel} · ${workspaceStore.currentViewportLabel}`
);

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

const setViewport = (mode: ViewportMode) => workspaceStore.setViewportMode(mode);
</script>

<template>
  <section class="mode-switch" aria-label="分析与视图模式">
    <div class="mode-switch__brand">
      <span class="mode-switch__version">2.0</span>
      <span class="mode-switch__status">{{ statusText }}</span>
    </div>

    <div class="mode-switch__controls">
      <div class="mode-group">
        <span class="mode-group__label">分析</span>
        <v-btn-toggle
          :model-value="workspaceStore.analysisDimension"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          divided
        >
          <v-btn value="2d" size="small" prepend-icon="mdi-axis-arrow" @click="requestDimension('2d')">
            二维
          </v-btn>
          <v-btn value="3d" size="small" prepend-icon="mdi-axis-arrow-info" @click="requestDimension('3d')">
            三维
          </v-btn>
        </v-btn-toggle>
      </div>

      <div class="mode-group">
        <span class="mode-group__label">视图</span>
        <v-btn-toggle
          :model-value="workspaceStore.viewportMode"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          divided
        >
          <v-btn value="2d" size="small" icon="mdi-view-dashboard-outline" title="二维视图" @click="setViewport('2d')" />
          <v-btn value="3d" size="small" icon="mdi-cube-outline" title="三维视图" @click="setViewport('3d')" />
          <v-btn value="split" size="small" icon="mdi-view-split-vertical" title="二维/三维分屏" @click="setViewport('split')" />
        </v-btn-toggle>
      </div>

      <v-btn-toggle
        v-if="workspaceStore.analysisDimension === '3d' && workspaceStore.viewportMode !== '3d'"
        v-model="workspaceStore.activeWorkPlane"
        mandatory
        density="compact"
        color="secondary"
        variant="outlined"
        divided
        aria-label="二维投影工作平面"
      >
        <v-btn value="xy" size="small">XY</v-btn>
        <v-btn value="xz" size="small">XZ</v-btn>
        <v-btn value="yz" size="small">YZ</v-btn>
      </v-btn-toggle>
    </div>
  </section>

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
.mode-switch {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(0, 55, 149, 0.18);
  background: rgb(var(--v-theme-surface));
}

.mode-switch__brand,
.mode-switch__controls,
.mode-group {
  display: flex;
  align-items: center;
}

.mode-switch__brand { min-width: 0; gap: 9px; }
.mode-switch__controls { flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.mode-group { gap: 6px; }

.mode-switch__version {
  min-width: 34px;
  padding: 3px 6px;
  border-radius: 4px;
  background: #003b7a;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.mode-switch__status {
  overflow: hidden;
  color: #183b67;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-group__label {
  color: rgba(20, 43, 72, 0.7);
  font-size: 12px;
}

@media (max-width: 760px) {
  .mode-switch {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    padding: 6px 8px;
  }

  .mode-switch__controls {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .mode-switch__status { max-width: calc(100vw - 70px); }
  .mode-group__label { display: none; }
}
</style>
