<template>
  <v-dialog v-model="open" max-width="760">
    <v-card class="welcome-guide">
      <header class="welcome-guide__header">
        <img src="/app-icon.png" alt="" />
        <div>
          <span>{{ $t('welcome.eyebrow') }}</span>
          <h2>{{ $t('welcome.heading') }}</h2>
          <p>{{ $t('welcome.description') }}</p>
        </div>
      </header>

      <v-card-text class="welcome-guide__body">
        <ol class="welcome-guide__steps" aria-label="基本使用流程">
          <li v-for="(step, index) in quickSteps" :key="step.title">
            <b>{{ index + 1 }}</b>
            <span><strong>{{ step.title }}</strong><small>{{ step.description }}</small></span>
          </li>
        </ol>

        <div class="welcome-guide__section-title">
          <div>
            <h3>{{ $t('welcome.examplesTitle') }}</h3>
            <p>{{ $t('welcome.examplesDescription') }}</p>
          </div>
          <label><input v-model="guideAfterLoad" type="checkbox" />{{ $t('welcome.guideAfterLoad') }}</label>
        </div>

        <div class="welcome-guide__examples">
          <button type="button" class="welcome-example welcome-example--2d" @click="loadExample('2d')">
            <span class="welcome-example__icon"><v-icon size="28">mdi-chart-bell-curve-cumulative</v-icon></span>
            <span class="welcome-example__copy">
              <span class="welcome-example__badge">2D</span>
              <strong>{{ $t('welcome.example2d.title') }}</strong>
              <small>{{ $t('welcome.example2d.description') }}</small>
              <em>{{ $t('welcome.example2d.focus') }}</em>
            </span>
            <v-icon size="20">mdi-arrow-right</v-icon>
          </button>

          <button type="button" class="welcome-example welcome-example--3d" @click="loadExample('3d')">
            <span class="welcome-example__icon"><v-icon size="28">mdi-cube-scan</v-icon></span>
            <span class="welcome-example__copy">
              <span class="welcome-example__badge">3D</span>
              <strong>{{ $t('welcome.example3d.title') }}</strong>
              <small>{{ $t('welcome.example3d.description') }}</small>
              <em>{{ $t('welcome.example3d.focus') }}</em>
            </span>
            <v-icon size="20">mdi-arrow-right</v-icon>
          </button>
        </div>
      </v-card-text>

      <v-card-actions class="welcome-guide__actions">
        <v-btn prepend-icon="mdi-compass-outline" variant="text" @click="startTour">{{ $t('tour.startTour') }}</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="finish">{{ $t('welcome.continueWorkspace') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref } from 'vue';
import { closeModal } from 'jenesius-vue-modal';
import { useVOnboarding } from 'v-onboarding';
import 'v-onboarding/dist/style.css';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/store/app';
import { useStructuralStore } from '@/store/structural';
import { useWorkspaceStore } from '@/store/workspace';
import { applyEducationTemplate } from '@/utils/educationTemplates';
import { eventBus, EventType } from '@/EventBus';

const wrapper = inject('onboardingWrapper');
const appStore = useAppStore();
const structuralStore = useStructuralStore();
const workspaceStore = useWorkspaceStore();
const { t } = useI18n();

const open = ref(true);
const guideAfterLoad = ref(true);
const quickSteps = computed(() => [
  { title: t('welcome.steps.model'), description: t('welcome.steps.modelDescription') },
  { title: t('welcome.steps.load'), description: t('welcome.steps.loadDescription') },
  { title: t('welcome.steps.solve'), description: t('welcome.steps.solveDescription') },
  { title: t('welcome.steps.review'), description: t('welcome.steps.reviewDescription') },
]);

const prepareTour = async () => {
  if (workspaceStore.analysisDimension === '2d') {
    appStore.bottomBarOpen = true;
    appStore.bottomBarTab ||= 'tab-nodes';
  }
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 80));
};

const startTour = async () => {
  appStore.onboardingFinished = true;
  closeModal();
  await prepareTour();
  useVOnboarding(wrapper).start();
};

const finish = () => {
  appStore.onboardingFinished = true;
  closeModal();
};

const loadExample = async (dimension: '2d' | '3d') => {
  if (dimension === '2d') {
    workspaceStore.switchTo2DPreservingSpatialModel();
    workspaceStore.setViewportMode('2d');
    applyEducationTemplate('simply-supported');
    appStore.bottomBarOpen = true;
    appStore.bottomBarTab = 'tab-education';
  } else {
    workspaceStore.startNew3D('space-frame');
    structuralStore.loadDefaultSpaceFrameExample();
    workspaceStore.setViewportMode('3d');
    appStore.bottomBarOpen = false;
  }

  appStore.onboardingFinished = true;
  closeModal();
  await nextTick();
  window.setTimeout(() => eventBus.emit(EventType.FIT_CONTENT), 100);
  if (guideAfterLoad.value) {
    await prepareTour();
    useVOnboarding(wrapper).start();
  }
};
</script>

<style scoped>
.welcome-guide { overflow: hidden; color: var(--text-primary); }
.welcome-guide__header { display: flex; gap: 14px; padding: 20px 22px 17px; border-bottom: 1px solid var(--header-border); background: var(--header-bg); color: #fff; }
.welcome-guide__header img { width: 52px; height: 52px; border: 1px solid rgba(255, 255, 255, 0.38); border-radius: 6px; object-fit: cover; }
.welcome-guide__header span { color: #a9c9e2; font-size: 10px; font-weight: 700; }
.welcome-guide__header h2 { margin: 1px 0 4px; font-size: 20px; letter-spacing: 0; }
.welcome-guide__header p { margin: 0; color: #c9d9e6; font-size: 12px; }
.welcome-guide__body { padding: 17px 22px 14px !important; }
.welcome-guide__steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin: 0 0 20px; padding: 0; list-style: none; }
.welcome-guide__steps li { display: flex; align-items: center; gap: 8px; min-width: 0; padding-right: 10px; border-right: 1px solid var(--border-default); }
.welcome-guide__steps li:not(:first-child) { padding-left: 10px; }
.welcome-guide__steps li:last-child { border-right: 0; }
.welcome-guide__steps b { display: grid; flex: 0 0 24px; width: 24px; height: 24px; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; color: var(--accent-strong); font: 11px var(--font-mono); }
.welcome-guide__steps span { display: flex; min-width: 0; flex-direction: column; }
.welcome-guide__steps strong { font-size: 11px; }
.welcome-guide__steps small { overflow: hidden; color: var(--text-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.welcome-guide__section-title { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
.welcome-guide__section-title h3 { margin: 0; font-size: 14px; }
.welcome-guide__section-title p { margin: 2px 0 0; color: var(--text-muted); font-size: 11px; }
.welcome-guide__section-title label { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 11px; white-space: nowrap; cursor: pointer; }
.welcome-guide__section-title input { accent-color: var(--accent); }
.welcome-guide__examples { border-top: 1px solid var(--border-default); }
.welcome-example { display: grid; grid-template-columns: 46px minmax(0, 1fr) 24px; align-items: center; gap: 12px; width: 100%; min-height: 82px; padding: 11px 12px; border: 0; border-bottom: 1px solid var(--border-default); background: transparent; color: var(--text-primary); text-align: left; cursor: pointer; transition: 120ms ease; }
.welcome-example:hover { background: var(--bg-control-hover); }
.welcome-example:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; box-shadow: inset 4px 0 0 var(--accent); }
.welcome-example__icon { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-input); }
.welcome-example--2d .welcome-example__icon { color: var(--semantic-result); }
.welcome-example--3d .welcome-example__icon { color: var(--semantic-load); }
.welcome-example__copy { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 8px; min-width: 0; }
.welcome-example__badge { padding: 1px 5px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--accent-strong); font: 9px var(--font-mono); }
.welcome-example__copy strong { font-size: 13px; }
.welcome-example__copy small { grid-column: 1 / -1; color: var(--text-secondary); font-size: 11px; }
.welcome-example__copy em { grid-column: 1 / -1; color: var(--text-muted); font-size: 10px; font-style: normal; }
.welcome-guide__actions { min-height: 48px; padding: 7px 14px !important; border-top: 1px solid var(--border-default); background: var(--bg-toolbar); }
@media (max-width: 620px) {
  .welcome-guide__steps { grid-template-columns: repeat(2, 1fr); row-gap: 10px; }
  .welcome-guide__steps li:nth-child(2) { border-right: 0; }
  .welcome-guide__section-title { align-items: start; flex-direction: column; }
}
</style>
