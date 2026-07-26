<script setup lang="ts">
import StructuralViewportHost from './StructuralViewportHost.vue';
import SpaceTrussWorkbench from './SpaceTrussWorkbench.vue';
import { useWorkspaceStore } from '@/store/workspace';

defineProps<{ id: string }>();

const workspaceStore = useWorkspaceStore();
</script>

<template>
  <StructuralViewportHost
    v-if="workspaceStore.analysisDimension === '2d'"
    id="planar-workspace"
  />
  <SpaceTrussWorkbench v-else id="spatial-workspace" />
</template>
