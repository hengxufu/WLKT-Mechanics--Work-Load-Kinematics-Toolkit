<template>
  <div class="editor-shell d-flex flex-column fill-height">
    <div style="height: 100%; width: 100%; position: absolute; pointer-events: none">
      <TransitionGroup name="fade">
        <Widget v-for="widget of layoutStore.widgets" :key="widget.title" :widget="widget" />
      </TransitionGroup>
    </div>
    <AnalysisViewportSwitch v-if="!appStore.inViewerMode" />
    <HelloWorld class="editor-shell__workspace" />
    <QuickWorkflow v-if="!appStore.inViewerMode && isPlanarAnalysis" />
    <div v-if="isPlanarAnalysis" class="resizer" data-direction="vertical"></div>
    <BottomBar
      v-if="!appStore.inViewerMode && isPlanarAnalysis"
      :height="computedBottomBarHeight"
      class="d-block"
    />
  </div>
</template>

<script lang="ts" setup>
import HelloWorld from '@/components/HelloWorld.vue';
import BottomBar from '@/components/BottomBar.vue';
import Widget from '@/components/Widget.vue';
import QuickWorkflow from '@/components/QuickWorkflow.vue';
import AnalysisViewportSwitch from '@/components/AnalysisViewportSwitch.vue';

import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useLayoutStore } from '@/store/layout';
import { useWorkspaceStore } from '@/store/workspace';

const appStore = useAppStore();
const projectStore = useProjectStore();
const layoutStore = useLayoutStore();
const workspaceStore = useWorkspaceStore();
const isPlanarAnalysis = computed(() => workspaceStore.analysisDimension === '2d');

const drag = ref(false);

const computedBottomBarHeight = computed(() => {
  if (appStore.inViewerMode) return 0;

  return appStore.bottomBarOpen ? appStore.bottomBarHeight : 36;
});

const mouseMove = (e: MouseEvent) => {
  if (drag.value) {
    const val = appStore.bottomBarHeight - e.movementY;

    document.getSelection().removeAllRanges();

    if (val < 193) return (appStore.bottomBarHeight = 193);
    if (val > window.innerHeight / 2) return (appStore.bottomBarHeight = window.innerHeight / 2);

    appStore.bottomBarHeight = val;
  }
};

const onMouseDown = (e: MouseEvent) => {
  if (e.target instanceof HTMLElement && e.target.dataset.direction === 'vertical') {
    drag.value = true;
  }
};

const onMouseUp = () => {
  drag.value = false;
};

onMounted(() => {
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousedown', onMouseDown);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', mouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('mousedown', onMouseDown);
});
</script>

<style lang="scss">
.editor-shell__workspace {
  flex: 1 1 auto;
  min-height: 0;
}

.resizer[data-direction='horizontal'] {
  background-color: #cbd5e0;
  cursor: ew-resize;
  height: 100%;
  width: 2px;
}
.resizer[data-direction='vertical'] {
  cursor: ns-resize;
  height: 0px;
  width: 100%;
  display: flex;
  position: relative;
}

.resizer[data-direction='vertical']::after {
  content: '';
  background-color: transparent;
  cursor: ns-resize;
  height: 12px;
  margin-top: -6px;
  width: 100%;
  display: flex;
  position: absolute;
  z-index: 100;
}
</style>
