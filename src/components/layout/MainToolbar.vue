<script setup lang="ts">
import { computed } from 'vue';
import { openModal } from 'jenesius-vue-modal';
import AddElement from '@/components/dialogs/AddElement.vue';
import AddElementLoad from '@/components/dialogs/AddElementLoad.vue';
import AddNodalLoad from '@/components/dialogs/AddNodalLoad.vue';
import AddNode from '@/components/dialogs/AddNode.vue';
import { undoRedoManager } from '@/CommandManager';
import { eventBus, EventType } from '@/EventBus';
import { MouseMode } from '@/mouse';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useSolverStore } from '@/store/solver';
import { useStructuralStore } from '@/store/structural';
import { useViewerStore } from '@/store/viewer';
import { useWorkspaceStore } from '@/store/workspace';
import type { ViewportMode } from '@/types/workspace';

const appStore = useAppStore();
const projectStore = useProjectStore();
const solverStore = useSolverStore();
const structuralStore = useStructuralStore();
const viewerStore = useViewerStore();
const workspaceStore = useWorkspaceStore();

const isPlanar = computed(() => workspaceStore.analysisDimension === '2d');
const hasSelection = computed(() =>
  isPlanar.value
    ? projectStore.isAnythingSelected2()
    : Boolean(structuralStore.selectedNodeId || structuralStore.selectedMemberId)
);
const isSolved = computed(() =>
  isPlanar.value
    ? Boolean(projectStore.solver.loadCases[0]?.solved)
    : structuralStore.resultIsCurrent
);

const planarResult = computed({
  get: () => {
    if (viewerStore.showNormalForce) return 'normal';
    if (viewerStore.showShearForce) return 'shear';
    if (viewerStore.showBendingMoment) return 'moment';
    if (viewerStore.showDeformedShape) return 'displacement';
    return 'model';
  },
  set: (value: string) => {
    viewerStore.showNormalForce = value === 'normal';
    viewerStore.showShearForce = value === 'shear';
    viewerStore.showBendingMoment = value === 'moment';
    viewerStore.showDeformedShape = value === 'displacement';
  },
});

const currentResult = computed({
  get: () => isPlanar.value ? planarResult.value : viewerStore.threeDResultMode,
  set: (value: string) => {
    if (isPlanar.value) planarResult.value = value;
    else viewerStore.threeDResultMode = value as typeof viewerStore.threeDResultMode;
  },
});

const resultItems = computed(() => [
  { title: '结构模型', value: 'model' },
  { title: '变形', value: 'displacement' },
  { title: '轴力 N', value: 'normal' },
  { title: '剪力 V', value: 'shear' },
  { title: '弯矩 M', value: 'moment' },
]);

const setViewport = (mode: ViewportMode) => workspaceStore.setViewportMode(mode);
const openData = (tab: string) => {
  appStore.bottomBarTab = `tab-${tab}`;
  appStore.bottomBarOpen = true;
};

const removeSelection = () => {
  if (!isPlanar.value) return;
  projectStore.deleteSelection2();
  projectStore.solve();
};

const solve = async () => {
  if (isPlanar.value) {
    projectStore.solve();
    openData('results');
    return;
  }
  if (!structuralStore.validation.valid || solverStore.isSolving) return;
  structuralStore.setResult(await solverStore.solve(structuralStore.model));
};
</script>

<template>
  <div id="viewerControls" class="main-toolbar" aria-label="建模快捷工具栏">
    <div class="main-toolbar__group" aria-label="编辑工具">
      <v-tooltip text="选择对象  Esc" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :class="{ active: appStore.mouseMode === MouseMode.NONE }" @click="appStore.mouseMode = MouseMode.NONE"><v-icon size="18">mdi-cursor-default-outline</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="创建节点  N" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" :class="{ active: appStore.mouseMode === MouseMode.ADD_NODE }" @click="appStore.mouseMode = MouseMode.ADD_NODE"><v-icon size="18">mdi-vector-point-plus</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="创建梁单元  B" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" :class="{ active: appStore.mouseMode === MouseMode.ADD_ELEMENT }" @click="appStore.mouseMode = MouseMode.ADD_ELEMENT"><v-icon size="18">mdi-vector-polyline-plus</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="添加尺寸标注" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" :class="{ active: appStore.mouseMode === MouseMode.ADD_DIMLINE }" @click="appStore.mouseMode = MouseMode.ADD_DIMLINE"><v-icon size="18">mdi-arrow-expand-horizontal</v-icon></button></template>
      </v-tooltip>
    </div>

    <span class="toolbar-separator" />

    <div class="main-toolbar__group" aria-label="荷载与约束">
      <v-tooltip text="添加集中力或力矩  F / M" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button tool-button--load" :disabled="!isPlanar" @click="openModal(AddNodalLoad)"><v-icon size="18">mdi-arrow-down-bold-outline</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="添加梁上载荷" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button tool-button--load" :disabled="!isPlanar" @click="openModal(AddElementLoad)"><v-icon size="18">mdi-distribute-horizontal-center</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="通过对话框添加节点" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" @click="openModal(AddNode, {})"><v-icon size="18">mdi-form-textbox</v-icon></button></template>
      </v-tooltip>
      <v-tooltip text="通过对话框添加单元" location="bottom">
        <template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" @click="openModal(AddElement, {})"><v-icon size="18">mdi-vector-line</v-icon></button></template>
      </v-tooltip>
    </div>

    <span class="toolbar-separator" />

    <div class="main-toolbar__group" aria-label="历史与删除">
      <v-tooltip text="撤销  Ctrl+Z" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button" @click="undoRedoManager.undo()"><v-icon size="18">mdi-undo</v-icon></button></template></v-tooltip>
      <v-tooltip text="重做  Ctrl+Shift+Z" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button" @click="undoRedoManager.redo()"><v-icon size="18">mdi-redo</v-icon></button></template></v-tooltip>
      <v-tooltip text="删除选中对象  Del" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button tool-button--danger" :disabled="!hasSelection || !isPlanar" @click="removeSelection"><v-icon size="18">mdi-delete-outline</v-icon></button></template></v-tooltip>
    </div>

    <span class="toolbar-separator" />

    <div class="main-toolbar__group" aria-label="视口工具">
      <v-tooltip text="适应窗口" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button" @click="eventBus.emit(EventType.FIT_CONTENT)"><v-icon size="18">mdi-fit-to-screen-outline</v-icon></button></template></v-tooltip>
      <v-tooltip text="显示网格  G" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button" :class="{ active: viewerStore.showGrid }" @click="viewerStore.showGrid = !viewerStore.showGrid"><v-icon size="18">mdi-grid</v-icon></button></template></v-tooltip>
      <v-tooltip text="捕捉网格  S" location="bottom"><template #activator="{ props }"><button v-bind="props" class="tool-button" :disabled="!isPlanar" :class="{ active: viewerStore.snapToGrid }" @click="viewerStore.snapToGrid = !viewerStore.snapToGrid"><v-icon size="18">mdi-magnet-on</v-icon></button></template></v-tooltip>
    </div>

    <div class="main-toolbar__spacer" />

    <div v-if="isSolved" class="result-toolbar" aria-label="结果显示">
      <v-icon size="16" color="accent">mdi-chart-bell-curve</v-icon>
      <v-select v-model="currentResult" :items="resultItems" density="compact" hide-details variant="plain" aria-label="结果类型" />
      <button class="tool-button" :class="{ active: viewerStore.showDeformedOverlay }" title="显示原结构" @click="viewerStore.showDeformedOverlay = !viewerStore.showDeformedOverlay"><v-icon size="17">mdi-layers-triple-outline</v-icon></button>
    </div>

    <div class="viewport-segment" aria-label="视口模式">
      <button :class="{ active: workspaceStore.viewportMode === '2d' }" title="二维视口" @click="setViewport('2d')"><v-icon size="17">mdi-vector-square</v-icon><span>2D</span></button>
      <button :class="{ active: workspaceStore.viewportMode === '3d' }" title="三维视口" @click="setViewport('3d')"><v-icon size="17">mdi-cube-outline</v-icon><span>3D</span></button>
      <button :class="{ active: workspaceStore.viewportMode === 'split' }" title="二维/三维分屏" @click="setViewport('split')"><v-icon size="17">mdi-view-split-vertical</v-icon></button>
    </div>

    <button class="solve-button" :disabled="solverStore.isSolving" @click="solve">
      <v-icon size="17">mdi-play</v-icon>
      <span>{{ solverStore.isSolving ? '求解中' : '求解' }}</span>
    </button>

    <button class="tool-button" :class="{ active: appStore.bottomBarOpen }" title="数据面板" @click="appStore.bottomBarOpen = !appStore.bottomBarOpen"><v-icon size="18">mdi-table-large</v-icon></button>
  </div>
</template>

<style scoped>
.main-toolbar { display: flex; flex: 0 0 var(--toolbar-height); align-items: center; gap: 4px; min-width: 0; padding: 3px 6px; border-bottom: 1px solid var(--border-default); background: var(--bg-toolbar); color: var(--text-primary); }
.main-toolbar__group { display: flex; align-items: center; gap: 2px; }
.main-toolbar__spacer { flex: 1 1 auto; min-width: 8px; }
.toolbar-separator { width: 1px; height: 22px; margin: 0 2px; background: var(--border-default); }
.tool-button { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); cursor: pointer; transition: 120ms ease; }
.tool-button:hover:not(:disabled), .tool-button.active { border-color: var(--border-default); background: var(--bg-hover); color: var(--text-primary); }
.tool-button.active { box-shadow: inset 0 -2px 0 var(--accent); color: var(--accent-strong); }
.tool-button--load { color: var(--semantic-load); }
.tool-button--danger:hover:not(:disabled) { color: var(--danger); }
.tool-button:disabled { opacity: 0.34; cursor: not-allowed; }
.viewport-segment { display: flex; height: 28px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); overflow: hidden; }
.viewport-segment button { display: flex; align-items: center; gap: 4px; min-width: 34px; padding: 0 7px; border: 0; border-right: 1px solid var(--border-default); background: var(--bg-input); color: var(--text-secondary); font: 11px var(--font-mono); cursor: pointer; }
.viewport-segment button:last-child { border-right: 0; }
.viewport-segment button.active { background: var(--bg-selected); color: var(--accent-strong); }
.solve-button { display: flex; align-items: center; gap: 4px; height: 29px; padding: 0 10px; border: 1px solid #3d8b69; border-radius: var(--radius-sm); background: rgba(86, 181, 138, 0.12); color: var(--success); font-size: 12px; font-weight: 650; cursor: pointer; }
.solve-button:hover:not(:disabled) { background: rgba(86, 181, 138, 0.2); }
.solve-button:disabled { opacity: 0.5; }
.result-toolbar { display: flex; align-items: center; gap: 4px; height: 30px; min-width: 180px; padding-left: 7px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-input); }
.result-toolbar :deep(.v-select) { width: 118px; font-size: 11px; }
.result-toolbar :deep(.v-field__input) { min-height: 28px; padding: 0 4px; }

@media (max-width: 1180px) {
  .main-toolbar__group:nth-of-type(2), .result-toolbar { display: none; }
}
</style>
