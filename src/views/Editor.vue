<template>
  <div class="editor-shell d-flex flex-column fill-height">
    <div class="editor-shell__widgets">
      <TransitionGroup name="fade">
        <Widget v-for="widget of layoutStore.widgets" :key="widget.title" :widget="widget" />
      </TransitionGroup>
    </div>
    <template v-if="appStore.inViewerMode">
      <HelloWorld class="editor-shell__workspace" />
    </template>
    <template v-else>
      <MainToolbar />
      <WorkspaceLayout>
        <template #left><ModelTree /></template>
        <HelloWorld class="editor-shell__workspace" />
        <template #right><InspectorPanel /></template>
      </WorkspaceLayout>
      <div v-if="isPlanarAnalysis && appStore.bottomBarOpen" class="resizer" data-direction="vertical"></div>
      <BottomBar
        v-if="isPlanarAnalysis && appStore.bottomBarOpen"
        :height="appStore.bottomBarHeight"
        class="d-block editor-shell__data-dock"
      />
      <StatusBar />
    </template>
  </div>
</template>

<script lang="ts" setup>
import HelloWorld from '@/components/HelloWorld.vue';
import BottomBar from '@/components/BottomBar.vue';
import Widget from '@/components/Widget.vue';
import MainToolbar from '@/components/layout/MainToolbar.vue';
import ModelTree from '@/components/layout/ModelTree.vue';
import InspectorPanel from '@/components/layout/InspectorPanel.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';

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
.editor-shell {
  min-width: 0;
  min-height: 0;
  background: var(--bg-app);
}

.editor-shell__widgets {
  position: absolute;
  z-index: 900;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.editor-shell__workspace {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--bg-viewport);
}

.editor-shell__workspace > .v-window {
  flex: 1 1 auto;
  min-height: 0;
}

.editor-shell__data-dock {
  flex: 0 0 auto;
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
