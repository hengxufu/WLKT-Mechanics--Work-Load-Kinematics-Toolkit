<template>
  <aside class="quick-workflow" aria-label="建模流程">
    <div class="quick-workflow__brand">
      <span class="quick-workflow__eyebrow">BUAA</span>
      <strong>{{ $t('workflow.title') }}</strong>
    </div>

    <div class="quick-workflow__steps">
      <v-tooltip v-for="step in steps" :key="step.id" location="right">
        <template #activator="{ props }">
          <button
            v-bind="props"
            class="quick-workflow__step"
            :class="{ 'quick-workflow__step--active': step.active(), 'quick-workflow__step--ready': step.ready() }"
            type="button"
            @click="step.action"
          >
            <span class="quick-workflow__index">{{ step.index }}</span>
            <v-icon size="19">{{ step.icon }}</v-icon>
            <span class="quick-workflow__label">{{ step.label }}</span>
            <span class="quick-workflow__count">{{ step.count() }}</span>
          </button>
        </template>
        <span>{{ step.tooltip }}</span>
      </v-tooltip>
    </div>

    <div class="quick-workflow__tools">
      <v-tooltip location="right">
        <template #activator="{ props }">
          <button v-bind="props" class="quick-workflow__tool" type="button" @click="fitContent">
            <v-icon size="18">mdi-fit-to-page-outline</v-icon>
          </button>
        </template>
        <span>{{ $t('workflow.fitView') }}</span>
      </v-tooltip>
      <v-tooltip location="right">
        <template #activator="{ props }">
          <button v-bind="props" class="quick-workflow__tool" type="button" @click="clearMode">
            <v-icon size="18">mdi-cursor-default-outline</v-icon>
          </button>
        </template>
        <span>{{ $t('workflow.selectMode') }}</span>
      </v-tooltip>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { MouseMode } from '@/mouse';
import { eventBus, EventType } from '@/EventBus';

const appStore = useAppStore();
const projectStore = useProjectStore();
const { t } = useI18n();

const openBottomTab = (tab: string) => {
  appStore.tab = 0;
  appStore.bottomBarOpen = true;
  appStore.bottomBarTab = `tab-${tab}`;
};

const startMode = (tab: string, mode: MouseMode) => {
  openBottomTab(tab);
  appStore.mouseMode = mode;
};

const clearMode = () => {
  appStore.mouseMode = MouseMode.NONE;
};

const fitContent = () => {
  eventBus.emit(EventType.FIT_CONTENT);
};

const solveAndShowResults = () => {
  clearMode();
  projectStore.solve();
  openBottomTab('results');
};

const loadCount = computed(
  () =>
    projectStore.solver.loadCases[0].nodalLoadList.length +
    projectStore.solver.loadCases[0].elementLoadList.length +
    projectStore.solver.loadCases[0].prescribedBC.length
);

const steps = computed(() => [
  {
    id: 'library',
    index: '01',
    icon: 'mdi-texture-box',
    label: t('workflow.library'),
    tooltip: t('workflow.libraryTip'),
    count: () => projectStore.solver.domain.materials.size + projectStore.solver.domain.crossSections.size,
    ready: () => projectStore.solver.domain.materials.size > 0 && projectStore.solver.domain.crossSections.size > 0,
    active: () => ['tab-mats', 'tab-cs'].includes(appStore.bottomBarTab),
    action: () => openBottomTab(projectStore.solver.domain.materials.size === 0 ? 'mats' : 'cs'),
  },
  {
    id: 'nodes',
    index: '02',
    icon: 'mdi-vector-point-plus',
    label: t('workflow.nodes'),
    tooltip: t('workflow.nodesTip'),
    count: () => projectStore.solver.domain.nodes.size,
    ready: () => projectStore.solver.domain.nodes.size >= 2,
    active: () => appStore.mouseMode === MouseMode.ADD_NODE || appStore.bottomBarTab === 'tab-nodes',
    action: () => startMode('nodes', MouseMode.ADD_NODE),
  },
  {
    id: 'elements',
    index: '03',
    icon: 'mdi-vector-polyline-plus',
    label: t('workflow.elements'),
    tooltip: t('workflow.elementsTip'),
    count: () => projectStore.solver.domain.elements.size,
    ready: () => projectStore.solver.domain.elements.size > 0,
    active: () => appStore.mouseMode === MouseMode.ADD_ELEMENT || appStore.bottomBarTab === 'tab-elements',
    action: () => startMode('elements', MouseMode.ADD_ELEMENT),
  },
  {
    id: 'loads',
    index: '04',
    icon: 'mdi-arrow-down-thin-circle-outline',
    label: t('workflow.loads'),
    tooltip: t('workflow.loadsTip'),
    count: () => loadCount.value,
    ready: () => loadCount.value > 0,
    active: () => appStore.bottomBarTab === 'tab-loads',
    action: () => openBottomTab('loads'),
  },
  {
    id: 'results',
    index: '05',
    icon: 'mdi-chart-bell-curve',
    label: t('workflow.results'),
    tooltip: t('workflow.resultsTip'),
    count: () => projectStore.solver.domain.elements.size,
    ready: () => projectStore.solver.domain.elements.size > 0,
    active: () => appStore.bottomBarTab === 'tab-results',
    action: solveAndShowResults,
  },
]);
</script>
