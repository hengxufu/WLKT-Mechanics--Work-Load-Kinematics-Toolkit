<script lang="ts">
import { container, openModal } from 'jenesius-vue-modal';
import { deserializeModel, download, exportJSON, importJSON } from './utils';
import { provide, nextTick } from 'vue';
import { undoRedoManager } from './CommandManager';
import { useViewerStore } from './store/viewer';
import Confirmation from './components/dialogs/Confirmation.vue';
import { createDimensionId } from './utils/id';
import { createDimensionPointFromNode } from './types/dimension';

export default {
  name: 'App',
  components: { WidgetContainerModal: container },
};
</script>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { DofID } from 'ts-fem';
import { resolveLocale, setLocale, availableLocales } from './plugins/i18n';
import { useTheme } from 'vuetify';

import Welcome from '@/components/dialogs/Welcome.vue';
import Share from '@/components/dialogs/Share.vue';
import Changelog from '@/components/dialogs/Changelog.vue';
import Editor from '@/views/Editor.vue';
import Dialogs from '@/components/Dialogs.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import { useProjectStore } from './store/project';
import { useAppStore } from './store/app';
import { useUiStore } from './store/ui';
import { useWorkspaceStore } from './store/workspace';

import { VOnboardingWrapper, VOnboardingStep } from 'v-onboarding';
import 'v-onboarding/dist/style.css';

import { useI18n } from 'vue-i18n';
import { eventBus, EventType } from './EventBus';
const { t } = useI18n();

const viewerStore = useViewerStore();
const workspaceStore = useWorkspaceStore();

const onboardingWrapper = ref(null);
provide('onboardingWrapper', onboardingWrapper);

const file = ref<HTMLInputElement | null>(null);

const steps = computed(() => {
  const spatial = workspaceStore.analysisDimension === '3d';
  const result = [
    {
      attachTo: { element: '#modelTreeGuideTarget' },
      content: {
        title: t('tour.modelTree.title'),
        description: t('tour.modelTree.description'),
      },
    },
    {
    attachTo: { element: '#viewerControls' },
    content: {
      title: t('tour.viewerControls.title'),
      description: t('tour.viewerControls.description'),
    },
    },
    {
      attachTo: { element: '.workspace-layout__viewport' },
      content: {
        title: t('tour.workspace.title'),
        description: spatial ? t('tour.workspace.description3d') : t('tour.workspace.description2d'),
      },
    },
    {
    attachTo: { element: spatial ? '#spatial-inspector' : '#viewerSettings' },
    content: {
      title: t('tour.viewerSettings.title'),
      description: t('tour.viewerSettings.description'),
    },
    },
  ];

  if (!spatial) result.push({
    attachTo: { element: '#dataDock' },
    content: {
      title: t('tour.bottomBar.title'),
      description: t('tour.bottomBar.description'),
    },
  });

  result.push({
    attachTo: { element: '#bottomBar' },
    content: {
      title: t('tour.statusBar.title'),
      description: t('tour.statusBar.description'),
    },
  });
  return result;
});

const openGuide = () => openModal(Welcome);

onMounted(() => {
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.key === '-')) {
      e.preventDefault();
    }

    // If CTRL+Z undo
    if (e.ctrlKey && !e.shiftKey && e.code === 'KeyZ') {
      e.preventDefault();
      undoRedoManager.undo();
    }

    // If CTRL+SHIFT+Z redo
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
      e.preventDefault();
      undoRedoManager.redo();
    }

    // Save project
    if (e.ctrlKey && e.code === 'KeyS') {
      e.preventDefault();
      saveProject();
    }

    // Open project
    if (e.ctrlKey && e.code === 'KeyO') {
      e.preventDefault();
      file.value.click();
    }
  });

  document.addEventListener(
    'wheel',
    function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { passive: false }
  );
});

const appStore = useAppStore();
const uiStore = useUiStore();
const vuetifyTheme = useTheme();

watch(
  () => uiStore.theme,
  (theme) => {
    vuetifyTheme.change(theme);
    document.documentElement.dataset.caeTheme = theme;
  },
  { immediate: true }
);

onMounted(() => {
  const solver = useProjectStore().solver;
  const domain = solver.domain;

  const params = new URL(document.location as unknown as URL).searchParams;
  const name = params.get('model');
  const lang = params.get('lang');
  const inViewerMode = params.get('viewer');

  if (inViewerMode) {
    appStore.inViewerMode = true;
  } else {
    if (!appStore.onboardingFinished) openModal(Welcome);
    else maybeShowChangelog();
  }

  if (name) {
    clearMesh(true, true);
    deserializeModel(name, solver, useProjectStore().dimensions);
    solve();

    const url = document.location.href;
    window.history.pushState({}, '', url.split('?')[0]);

    return;
  }

  const resolvedLang = resolveLocale(lang);
  if (lang && availableLocales.findIndex((l) => l.code === resolvedLang) >= 0) {
    appStore.locale = resolvedLang;
    const url = document.location.href;
    window.history.pushState({}, '', url.split('?')[0]);
  }

  if (domain.nodes.size > 0) return solve();

  domain.createNode(1, [0, 0, 0], [DofID.Dx, DofID.Ry, DofID.Dz]);
  domain.createNode(2, [0, 0, -3], []);
  domain.createNode(3, [3, 0, -3], []);
  domain.createNode(4, [3, 0, 0], [DofID.Dx, DofID.Dz]);

  domain.nodes = new Map(domain.nodes);

  domain.createBeam2D(1, [1, 2], 1, 1, [false, true]);
  domain.createBeam2D(2, [2, 3], 1, 1);
  domain.createBeam2D(3, [4, 3], 1, 1);

  domain.elements = new Map(domain.elements);

  domain.createCrossSection(1, {
    a: 1,
    iy: 8.356e-5,
    iz: 1.0,
    dyz: 999991.0,
    h: 1,
    k: 1e32,
    j: 99999.0,
  });

  domain.createMaterial(1, {
    e: 210000e6,
    g: 210000e6 / (2 * (1 + 0.2)),
    alpha: 12.0e-6,
    d: 4000 /*kg/m3!!!*/,
  });

  //solver.loadCases[0].createNodalLoad(3, { [DofID.Dx]: 10000, [DofID.Dz]: 0, [DofID.Ry]: 10000 });
  //solver.loadCases[0].createNodalLoad(3, { [DofID.Dx]: 0, [DofID.Dz]: 20 });

  solver.loadCases[0].createBeamElementTrapezoidalEdgeLoad(2, [0, 10000], [0, 30000], true);
  //solver.loadCases[0].createBeamElementUniformEdgeLoad(2, [0, 10000], true);
  //solver.loadCases[0].createPrescribedDisplacement("a", { [DofID.Dx]: 0.3, [DofID.Dz]: 0.2, [DofID.Ry]: 0.01 });

  domain.materials = new Map(domain.materials);
  domain.crossSections = new Map(domain.crossSections);

  solver.domain = domain;

  useProjectStore().dimensions.push({
    id: createDimensionId(),
    points: [
      createDimensionPointFromNode(domain.nodes.get('1')!),
      createDimensionPointFromNode(domain.nodes.get('4')!),
    ],
    distance: 1,
  });

  requestAnimationFrame(solve);
});

const solve = () => {
  useProjectStore().solve();
  nextTick(() => {
    eventBus.emit(EventType.FIT_CONTENT);
  });
};

const clearMesh = (clearMaterials = false, clearCrossSects = false) => {
  useProjectStore().solver.loadCases[0].solved = false;
  useProjectStore().solver.loadCases[0].prescribedBC = [];
  useProjectStore().solver.loadCases[0].nodalLoadList = [];
  useProjectStore().solver.loadCases[0].elementLoadList = [];
  useProjectStore().solver.domain.elements.clear();
  useProjectStore().solver.domain.nodes.clear();
  useProjectStore().dimensions = [];

  if (clearMaterials) {
    useProjectStore().solver.domain.materials.clear();
  }

  if (clearCrossSects) {
    useProjectStore().solver.domain.crossSections.clear();
  }

  undoRedoManager.clearHistory();
};

const confirmClearMesh = () => {
  openModal(Confirmation, {
    title: t('confirmation.clearMesh.title'),
    message: t('confirmation.clearMesh.message'),
    success: (params) => clearMesh(params.checkboxes[0].value, params.checkboxes[1].value),
    checkboxes: [
      { label: t('confirmation.clearMesh.materials'), value: false },
      { label: t('confirmation.clearMesh.crossSections'), value: false },
    ],
  });
};

const shareMesh = () => {
  openModal(Share);
};

const openChangelog = () => {
  openModal(Changelog);
};
const currentAppVersion = APP_VERSION;

const maybeShowChangelog = () => {
  if (appStore.inViewerMode) return;
  if (!currentAppVersion) return;
  if (appStore.lastSeenChangelogVersion === currentAppVersion) return;
  openModal(Changelog);
};

onMounted(() => {
  appStore.locale = resolveLocale(appStore.locale);
  setLocale(appStore.locale);
});

function preventDefaults(e) {
  e.preventDefault();
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults);
  });
});

function onDrop(e) {
  for (let i = 0; i < e.dataTransfer.files.length; i++) {
    const file = e.dataTransfer.files[i];
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result.toString();
      clearMesh(true, true);
      try {
        importJSON(JSON.parse(text));
        solve();
      } catch (e) {
        alert(t('warnings.importFailed'));
      }
    };
    reader.readAsText(file);
  }
}

function openFile(e) {
  // check if no file uploaded
  if (!e.target.files.length) return;

  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result.toString();
    clearMesh(true, true);

    try {
      importJSON(JSON.parse(text));
      solve();
    } catch (e) {
      alert(t('warnings.importFailed'));
    }

    appStore.tab = 0;
    appStore.drawerOpen = false;
  };
  reader.readAsText(file);
}

const saveProject = () => {
  download('project.json', JSON.stringify(exportJSON()));
};

const requestOpenProject = () => file.value?.click();

const app_version = currentAppVersion;
const app_released = APP_RELEASED;
const app_commit = APP_COMMIT;
const localDocsUrl = `${import.meta.env.BASE_URL}docs/local-app.html`;
</script>

<template>
  <v-app :data-cae-theme="uiStore.theme" @drop.prevent="onDrop">
    <VOnboardingWrapper
      ref="onboardingWrapper"
      :steps="steps"
      :options="{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
          ],
        },
        scrollToStep: {
          enabled: false,
        },
      }"
    >
      <template #default="{ previous, next, step, exit, isFirst, isLast, index }">
        <VOnboardingStep>
          <div class="bg-white shadow rounded-lg" style="max-width: 400px">
            <div class="px-4 py-5 sm:p-6">
              <div class="sm:flex sm:items-center sm:justify-between">
                <div v-if="step.content">
                  <h3 v-if="step.content.title" class="text-lg font-medium leading-6 text-gray-900">
                    {{ step.content.title }}
                  </h3>
                  <div v-if="step.content.description" class="mt-2 max-w-xl text-sm text-gray-500">
                    <p>{{ step.content.description }}</p>
                  </div>
                </div>
                <div class="mt-5 space-x-4 sm:mt-0 sm:ml-6 sm:flex sm:flex-shrink-0 sm:items-center relative">
                  <template v-if="!isFirst">
                    <v-btn type="button" flat color="grey-lighten-3" @click="previous">
                      {{ $t('tour.previousButton') }}
                    </v-btn>
                  </template>
                  <v-btn type="button" color="primary" flat class="ml-1" @click="next">
                    {{ isLast ? $t('tour.finishButton') : $t('tour.nextButton') }}
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </VOnboardingStep>
      </template>
    </VOnboardingWrapper>

    <AppHeader
      v-if="!appStore.inViewerMode"
      :docs-url="localDocsUrl"
      @open-project="requestOpenProject"
      @save-project="saveProject"
      @share-project="shareMesh"
      @clear-project="confirmClearMesh"
      @changelog="openChangelog"
      @guide="openGuide"
    />

    <v-main class="cae-main">
      <Editor />
    </v-main>

    <Dialogs />

    <widget-container-modal />

    <!-- <div
      class="d-none d-sm-flex align-center justify-space-between px-3 text-caption bg-secondary border-t"
      style="height: 24px"
    >
      <div>
        <a
          class="text-black text-decoration-none font-weight-medium"
          href="https://github.com/janvorisek/edubeam/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=%5BBUG%5D"
          target="_blank"
          >{{ $t("footer.reportIssue") }}</a
        >
        <a
          class="text-black text-decoration-none font-weight-medium ml-3"
          href="https://github.com/janvorisek/edubeam/issues/new?assignees=&labels=&projects=&template=feature_request.md&title="
          target="_blank"
          >{{ $t("footer.requestFeature") }}</a
        >
      </div>
      <div>edubeam v{{ app_version }} {{ $t("footer.released") }} {{ app_released }}</div>
    </div> -->
    <input ref="file" type="file" style="display: none" @change="openFile" />
  </v-app>
</template>

<style lang="scss">
.line-height-1 {
  line-height: 1 !important;
}

.svgViewer {
  position: absolute;
  width: 100%;
}

svg {
  display: block;
}

svg text {
  cursor: default;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.mouse {
  font-size: 12px;
}

.selecting {
  position: absolute;
  border: 1px solid #2f00ff;
  background: rgba(0, 0, 255, 0.2);
}

.tooltip {
  font-size: 14px;
  position: absolute;
  margin-top: -6px;
  margin-left: 18px;
}

.tooltip .content {
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
  padding: 3px 8px;
  //font-weight: bold;
  box-shadow: 1px 1px 1px #ddd;
}

.tooltip .content:after {
  content: '';
  position: absolute;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  left: -6px;
  top: 8px;
  border-right: 6px solid rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.inline-checkbox {
  .v-input--selection-controls__input {
    margin-right: 0px !important;
  }
}
</style>
