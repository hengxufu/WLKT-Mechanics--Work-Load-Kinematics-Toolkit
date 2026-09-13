<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useUiStore } from '@/store/ui';

const uiStore = useUiStore();
let resizing: 'left' | 'right' | null = null;

const gridStyle = computed(() => ({
  '--left-column': uiStore.leftSidebarCollapsed ? '32px' : `${uiStore.leftSidebarWidth}px`,
  '--right-column': uiStore.rightSidebarCollapsed ? '32px' : `${uiStore.rightSidebarWidth}px`,
  '--left-handle': uiStore.leftSidebarCollapsed ? '0px' : '4px',
  '--right-handle': uiStore.rightSidebarCollapsed ? '0px' : '4px',
}));

const move = (event: PointerEvent) => {
  if (resizing === 'left') uiStore.leftSidebarWidth = Math.min(320, Math.max(200, event.clientX));
  if (resizing === 'right') uiStore.rightSidebarWidth = Math.min(360, Math.max(260, window.innerWidth - event.clientX));
};

const stop = () => {
  resizing = null;
  document.body.classList.remove('cae-resizing');
  window.removeEventListener('pointermove', move);
  window.removeEventListener('pointerup', stop);
};

const start = (side: 'left' | 'right') => {
  resizing = side;
  document.body.classList.add('cae-resizing');
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
};

onBeforeUnmount(stop);
</script>

<template>
  <div class="workspace-layout" :style="gridStyle">
    <aside class="workspace-layout__sidebar workspace-layout__sidebar--left" :class="{ collapsed: uiStore.leftSidebarCollapsed }">
      <slot v-if="!uiStore.leftSidebarCollapsed" name="left" />
      <button v-else class="collapsed-rail" title="展开模型树" @click="uiStore.leftSidebarCollapsed = false"><v-icon size="18">mdi-file-tree-outline</v-icon></button>
    </aside>
    <div class="workspace-layout__resizer" aria-label="调整模型树宽度" @pointerdown="start('left')" />
    <main class="workspace-layout__viewport"><slot /></main>
    <div class="workspace-layout__resizer" aria-label="调整属性栏宽度" @pointerdown="start('right')" />
    <aside class="workspace-layout__sidebar workspace-layout__sidebar--right" :class="{ collapsed: uiStore.rightSidebarCollapsed }">
      <slot v-if="!uiStore.rightSidebarCollapsed" name="right" />
      <button v-else class="collapsed-rail" title="展开属性面板" @click="uiStore.rightSidebarCollapsed = false"><v-icon size="18">mdi-tune-variant</v-icon></button>
    </aside>
  </div>
</template>

<style scoped>
.workspace-layout { display: grid; grid-template-columns: var(--left-column) var(--left-handle) minmax(0, 1fr) var(--right-handle) var(--right-column); flex: 1 1 auto; min-width: 0; min-height: 0; overflow: hidden; background: var(--bg-app); }
.workspace-layout__sidebar { min-width: 0; min-height: 0; overflow: hidden; border-color: var(--border-default); border-style: solid; background: var(--bg-panel); }
.workspace-layout__sidebar--left { border-width: 0 1px 0 0; }
.workspace-layout__sidebar--right { border-width: 0 0 0 1px; }
.workspace-layout__sidebar.collapsed { display: flex; align-items: flex-start; justify-content: center; }
.workspace-layout__viewport { position: relative; min-width: 0; min-height: 0; overflow: hidden; background: var(--bg-viewport); }
.workspace-layout__resizer { position: relative; z-index: 10; background: var(--bg-app); cursor: ew-resize; }
.workspace-layout__resizer::after { position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: var(--border-default); content: ''; transform: translateX(-50%); transition: 120ms ease; }
.workspace-layout__resizer:hover::after { width: 2px; background: var(--accent); box-shadow: 0 0 0 2px var(--focus-ring); }
.collapsed-rail { width: 30px; height: 34px; border: 0; border-bottom: 1px solid var(--border-default); background: var(--bg-toolbar); color: var(--text-secondary); cursor: pointer; }
.collapsed-rail:hover { background: var(--bg-hover); color: var(--accent-strong); }
:global(body.cae-resizing) { cursor: ew-resize; user-select: none; }

@media (max-width: 900px) {
  .workspace-layout { grid-template-columns: 0 0 minmax(0, 1fr) 0 0; }
  .workspace-layout__sidebar, .workspace-layout__resizer { display: none; }
}
</style>
