<script setup lang="ts">
import { computed } from 'vue';
import SVGViewer from './SVGViewer.vue';
import Structural2DProjection from './Structural2DProjection.vue';
import Structure3DViewer from './Structure3DViewer.vue';
import { useWorkspaceStore } from '@/store/workspace';

defineProps<{ id: string }>();

const workspaceStore = useWorkspaceStore();
const planarComponent = computed(() =>
  workspaceStore.analysisDimension === '2d' ? SVGViewer : Structural2DProjection
);
</script>

<template>
  <div class="viewport-host">
    <component
      :is="planarComponent"
      v-if="workspaceStore.viewportMode === '2d'"
      :id="`${id}-2d`"
    />
    <Structure3DViewer
      v-else-if="workspaceStore.viewportMode === '3d'"
      :id="`${id}-3d`"
    />
    <div v-else class="viewport-host__split">
      <section class="viewport-host__pane">
        <span class="viewport-host__label">
          {{ workspaceStore.analysisDimension === '2d' ? '二维建模' : `${workspaceStore.activeWorkPlane.toUpperCase()} 投影` }}
        </span>
        <component :is="planarComponent" :id="`${id}-split-2d`" />
      </section>
      <section class="viewport-host__pane">
        <span class="viewport-host__label">三维结构</span>
        <Structure3DViewer :id="`${id}-split-3d`" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.viewport-host,
.viewport-host__split,
.viewport-host__pane {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.viewport-host__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.viewport-host__pane {
  position: relative;
  overflow: hidden;
  border-right: 1px solid rgba(0, 55, 149, 0.18);
}

.viewport-host__pane:last-child { border-right: 0; }

.viewport-host__label {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 5;
  padding: 3px 7px;
  border: 1px solid rgba(0, 55, 149, 0.14);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.92);
  color: #123766;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
}

@media (max-width: 900px) {
  .viewport-host__split {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, minmax(280px, 1fr));
    overflow: auto;
  }
  .viewport-host__pane { border-right: 0; border-bottom: 1px solid rgba(0, 55, 149, 0.18); }
}
</style>
