<script setup lang="ts">
import StructuralViewportHost from './StructuralViewportHost.vue';

defineProps<{ id: string }>();
</script>

<template>
  <StructuralViewportHost id="structural-workspace" />
</template>
