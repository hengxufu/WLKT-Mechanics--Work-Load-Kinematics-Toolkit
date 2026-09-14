<script setup lang="ts">
import { computed } from 'vue';
import { openModal } from 'jenesius-vue-modal';
import AnalysisViewportSwitch from '@/components/AnalysisViewportSwitch.vue';
import AddCrossSection from '@/components/dialogs/AddCrossSection.vue';
import AddElement from '@/components/dialogs/AddElement.vue';
import AddElementLoad from '@/components/dialogs/AddElementLoad.vue';
import AddMaterial from '@/components/dialogs/AddMaterial.vue';
import AddNodalLoad from '@/components/dialogs/AddNodalLoad.vue';
import AddNode from '@/components/dialogs/AddNode.vue';
import { undoRedoManager } from '@/CommandManager';
import { eventBus, EventType } from '@/EventBus';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useSolverStore } from '@/store/solver';
import { useStructuralStore } from '@/store/structural';
import { useUiStore } from '@/store/ui';
import { useViewerStore } from '@/store/viewer';
import { useWorkspaceStore } from '@/store/workspace';

const props = defineProps<{ docsUrl: string }>();
const emit = defineEmits<{
  openProject: [];
  saveProject: [];
  shareProject: [];
  clearProject: [];
  changelog: [];
  guide: [];
}>();

const appStore = useAppStore();
const projectStore = useProjectStore();
const solverStore = useSolverStore();
const structuralStore = useStructuralStore();
const uiStore = useUiStore();
const viewerStore = useViewerStore();
const workspaceStore = useWorkspaceStore();

const canDelete = computed(() =>
  workspaceStore.analysisDimension === '2d'
    ? projectStore.isAnythingSelected2()
    : Boolean(structuralStore.selectedNodeId || structuralStore.selectedMemberId)
);

const showData = (tab: string) => {
  appStore.bottomBarTab = `tab-${tab}`;
  appStore.bottomBarOpen = true;
};

const solve = async () => {
  if (workspaceStore.analysisDimension === '2d') {
    projectStore.solve();
    showData('results');
    return;
  }
  if (!structuralStore.validation.valid || solverStore.isSolving) return;
  structuralStore.setResult(await solverStore.solve(structuralStore.model));
};

const deleteSelection = () => {
  if (workspaceStore.analysisDimension === '2d') {
    projectStore.deleteSelection2();
    projectStore.solve();
  }
};
</script>

<template>
  <header class="cae-header" aria-label="应用菜单">
    <div class="cae-header__brand" title="拉压弯扭大师 2.0">
      <img src="/app-icon.png" alt="" class="cae-header__logo" />
      <div class="cae-header__brand-copy">
        <strong>拉压弯扭大师</strong>
        <span>Mechanics Studio</span>
      </div>
      <span class="cae-header__version">2.0</span>
    </div>

    <nav class="cae-header__menus" aria-label="主菜单">
      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">文件</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-folder-open-outline" title="打开工程" subtitle="Ctrl+O" @click="emit('openProject')" />
          <v-list-item prepend-icon="mdi-content-save-outline" title="保存工程" subtitle="Ctrl+S" @click="emit('saveProject')" />
          <v-divider />
          <v-list-item prepend-icon="mdi-share-variant-outline" title="导出与分享" @click="emit('shareProject')" />
          <v-list-item prepend-icon="mdi-delete-sweep-outline" title="清空当前模型" @click="emit('clearProject')" />
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">编辑</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-undo" title="撤销" subtitle="Ctrl+Z" @click="undoRedoManager.undo()" />
          <v-list-item prepend-icon="mdi-redo" title="重做" subtitle="Ctrl+Shift+Z" @click="undoRedoManager.redo()" />
          <v-divider />
          <v-list-item prepend-icon="mdi-delete-outline" title="删除选中对象" subtitle="Del" :disabled="!canDelete" @click="deleteSelection" />
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">建模</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-vector-point-plus" title="创建节点" subtitle="N" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddNode, {})" />
          <v-list-item prepend-icon="mdi-vector-polyline-plus" title="创建梁单元" subtitle="B" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddElement, {})" />
          <v-divider />
          <v-list-item prepend-icon="mdi-texture-box" title="定义材料" @click="workspaceStore.analysisDimension === '2d' ? openModal(AddMaterial) : undefined" />
          <v-list-item prepend-icon="mdi-shape-outline" title="定义截面" @click="workspaceStore.analysisDimension === '2d' ? openModal(AddCrossSection) : undefined" />
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">载荷</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-arrow-down-bold-outline" title="集中力 / 力矩" subtitle="F / M" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddNodalLoad)" />
          <v-list-item prepend-icon="mdi-distribute-horizontal-center" title="梁上载荷" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddElementLoad)" />
          <v-list-item prepend-icon="mdi-thermometer-lines" title="温度荷载" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddElementLoad)" />
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">约束</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-pin-outline" title="编辑节点约束" :disabled="workspaceStore.analysisDimension !== '2d'" @click="showData('nodes')" />
          <v-list-item prepend-icon="mdi-ray-start-arrow" title="位移边界条件" :disabled="workspaceStore.analysisDimension !== '2d'" @click="openModal(AddNodalLoad, { type: 'displacement' })" />
        </v-list>
      </v-menu>

      <button type="button" @click="solve">求解</button>
      <button type="button" @click="showData('results')">后处理</button>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">视图</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-fit-to-screen-outline" title="适应窗口" @click="eventBus.emit(EventType.FIT_CONTENT)" />
          <v-list-item prepend-icon="mdi-grid" title="显示网格" @click="viewerStore.showGrid = !viewerStore.showGrid">
            <template #append><v-icon v-if="viewerStore.showGrid" size="16">mdi-check</v-icon></template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-view-dashboard-outline" title="数据面板" @click="appStore.bottomBarOpen = !appStore.bottomBarOpen" />
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }"><button v-bind="menuProps">帮助</button></template>
        <v-list density="compact" class="cae-menu">
          <v-list-item prepend-icon="mdi-compass-outline" title="使用指导与默认案例" @click="emit('guide')" />
          <v-divider />
          <v-list-item prepend-icon="mdi-book-open-page-variant-outline" title="本地使用手册" :href="props.docsUrl" target="_blank" />
          <v-list-item prepend-icon="mdi-history" title="版本更新" @click="emit('changelog')" />
        </v-list>
      </v-menu>
    </nav>

    <div class="cae-header__spacer" />
    <AnalysisViewportSwitch />
    <button class="cae-header__unit" type="button" title="单位设置" @click="appStore.openSettings()">
      {{ appStore.units.Force }} · {{ appStore.units.Length }}
    </button>
    <button class="cae-icon-button" type="button" :title="uiStore.theme === 'dark' ? '切换浅色主题' : '切换深色主题'" @click="uiStore.toggleTheme">
      <v-icon size="18">{{ uiStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </button>
    <button class="cae-icon-button" type="button" title="设置" @click="appStore.openSettings()">
      <v-icon size="18">mdi-cog-outline</v-icon>
    </button>
  </header>
</template>

<style scoped>
.cae-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: var(--header-height);
  padding: 0 8px;
  border-bottom: 1px solid var(--header-border);
  background: var(--header-bg);
  color: #edf1f5;
  user-select: none;
}

.cae-header::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 1px; background: color-mix(in srgb, var(--brand-gold) 62%, transparent); content: ''; pointer-events: none; }

.cae-header__brand { display: flex; align-items: center; gap: 8px; min-width: 230px; height: 100%; padding-right: 10px; border-right: 1px solid rgba(255, 255, 255, 0.12); }
.cae-header__logo { width: 28px; height: 28px; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 5px; object-fit: cover; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28); }
.cae-header__brand-copy { display: flex; flex-direction: column; min-width: 0; line-height: 1.05; }
.cae-header__brand-copy strong { color: #f5f8fb; font-size: 13px; font-weight: 700; white-space: nowrap; }
.cae-header__brand-copy span { margin-top: 2px; color: #a9c1d5; font-size: 9px; }
.cae-header__version { padding: 1px 5px; border: 1px solid rgba(154, 198, 232, 0.38); border-radius: 3px; background: rgba(67, 139, 198, 0.15); color: #cae4f7; font: 10px var(--font-mono); }
.cae-header__menus { display: flex; align-self: stretch; }
.cae-header__menus > button { position: relative; min-width: 42px; padding: 0 8px; border: 0; background: transparent; color: #d1dce6; font-size: 12px; cursor: pointer; transition: background 120ms ease, color 120ms ease; }
.cae-header__menus > button:hover,
.cae-header__menus > button[aria-expanded='true'] { background: rgba(255, 255, 255, 0.1); color: #fff; }
.cae-header__menus > button[aria-expanded='true']::after { position: absolute; right: 8px; bottom: 0; left: 8px; height: 2px; background: var(--brand-gold); content: ''; }
.cae-header__menus > button:focus-visible,
.cae-header__unit:focus-visible { outline: 2px solid #8fc6ef; outline-offset: -3px; }
.cae-header__spacer { flex: 1 1 auto; min-width: 8px; }
.cae-header__unit { height: 26px; padding: 0 8px; border: 1px solid rgba(169, 193, 213, 0.3); border-radius: 3px; background: rgba(7, 23, 38, 0.18); color: #c1d2df; font: 11px var(--font-mono); cursor: pointer; }
.cae-header__unit:hover { border-color: rgba(169, 193, 213, 0.48); background: rgba(255, 255, 255, 0.1); color: #fff; }
.cae-header :deep(.cae-icon-button) { color: #c1d2df; }
.cae-header :deep(.cae-icon-button:hover) { border-color: rgba(169, 193, 213, 0.32); background: rgba(255, 255, 255, 0.1); color: #fff; }
.cae-menu { min-width: 220px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); }
.cae-menu :deep(.v-list-item-subtitle) { font-family: var(--font-mono); font-size: 10px; text-align: right; }

@media (max-width: 1500px) {
  .cae-header__brand { min-width: 190px; }
  .cae-header__brand-copy span { display: none; }
  .cae-header__menus > button { min-width: 38px; padding: 0 5px; }
}

@media (max-width: 1180px) {
  .cae-header__brand { min-width: auto; }
  .cae-header__brand-copy { display: none; }
  .cae-header__menus > button:nth-child(n + 6) { display: none; }
  .cae-header__unit { display: none; }
}
</style>
