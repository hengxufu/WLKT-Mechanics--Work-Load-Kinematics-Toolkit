<script setup lang="ts">
import { computed } from 'vue';
import PlanarInspector from '@/components/properties/PlanarInspector.vue';
import SpaceTrussWorkbench from '@/components/SpaceTrussWorkbench.vue';
import { useWorkspaceStore } from '@/store/workspace';

const workspaceStore = useWorkspaceStore();
const isPlanar = computed(() => workspaceStore.analysisDimension === '2d');
</script>

<template>
  <PlanarInspector v-if="isPlanar" />
  <SpaceTrussWorkbench v-else id="spatial-inspector" inspector-only />
</template>
