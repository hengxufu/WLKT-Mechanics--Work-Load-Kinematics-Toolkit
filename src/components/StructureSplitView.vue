<script setup lang="ts">
import SVGViewer from './SVGViewer.vue';
import Structure3DViewer from './Structure3DViewer.vue';

defineProps<{ id: string }>();
</script>

<template>
  <div class="structure-split-view">
    <section class="structure-split-view__pane">
      <div class="structure-split-view__title">二维建模视图</div>
      <SVGViewer id="split-2d" />
    </section>
    <section class="structure-split-view__pane">
      <div class="structure-split-view__title">三维结构视图</div>
      <Structure3DViewer id="split-3d" />
    </section>
  </div>
</template>

<style scoped>
.structure-split-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
}

.structure-split-view__pane {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid rgba(0, 55, 149, 0.18);
}

.structure-split-view__pane:last-child { border-right: 0; }

.structure-split-view__title {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 4;
  padding: 3px 7px;
  background: rgba(255, 255, 255, 0.88);
  color: #123766;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .structure-split-view { grid-template-columns: 1fr; grid-template-rows: minmax(280px, 1fr) minmax(280px, 1fr); }
  .structure-split-view__pane { border-right: 0; border-bottom: 1px solid rgba(0, 55, 149, 0.18); }
}
</style>
