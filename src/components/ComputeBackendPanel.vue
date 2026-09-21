<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSolverStore } from '@/store/solver';

const solverStore = useSolverStore();

const deviceItems = [
  { title: '自动选择', value: 'auto' },
  { title: '本地 GPU（实验检测）', value: 'webgpu' },
  { title: '本地 CPU · Worker', value: 'cpu' },
];

const capabilityColor = computed(() =>
  solverStore.capability?.deviceAvailable ? 'success' : 'warning'
);
const capabilityLabel = computed(() => {
  if (!solverStore.capability) return '检测中';
  return solverStore.capability.deviceAvailable ? 'WebGPU 可用，数值内核待启用' : 'WebGPU 不可用';
});

onMounted(() => {
  void solverStore.detectCapability();
});
</script>

<template>
  <section class="backend-panel" aria-label="本地计算设备">
    <div class="backend-panel__row">
      <v-select
        v-model="solverStore.settings.preferredBackend"
        label="计算设备"
        :items="deviceItems"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-chip :color="capabilityColor" size="small" variant="tonal">
        {{ capabilityLabel }}
      </v-chip>
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        title="重新检测本机 WebGPU"
        @click="solverStore.detectCapability(true)"
      />
    </div>

    <div class="backend-panel__status">
      <strong>{{ solverStore.backendLabel }}</strong>
      <span v-if="solverStore.lastElapsedMs > 0">{{ solverStore.lastElapsedMs.toFixed(1) }} ms</span>
      <span v-if="solverStore.lastRelativeResidual !== null">
        相对残差 {{ solverStore.lastRelativeResidual.toExponential(2) }}
      </span>
    </div>
    <v-alert
      v-if="solverStore.status.fallbackReason"
      type="info"
      density="compact"
      variant="tonal"
      class="mt-2"
    >
      {{ solverStore.status.fallbackReason }}
    </v-alert>
    <p class="backend-panel__note">
      所有模型与计算均停留在本机。WebGPU 当前仅做能力检测，未宣称启用 GPU 数值求解。
    </p>
  </section>
</template>

<style scoped>
.backend-panel {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid rgba(0, 55, 149, 0.16);
  border-left: 3px solid #0068b7;
  background: rgba(0, 104, 183, 0.035);
}

.backend-panel__row,
.backend-panel__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.backend-panel__row { flex-wrap: wrap; }
.backend-panel__row :deep(.v-select) { min-width: 0; flex: 1 1 calc(100% - 48px); }
.backend-panel__row :deep(.v-chip) { order: 3; max-width: 100%; height: auto; min-height: 24px; white-space: normal; }
.backend-panel__row :deep(.v-chip__content) { white-space: normal; }
.backend-panel__status { flex-wrap: wrap; margin-top: 8px; color: var(--text-secondary); font-size: 12px; }
.backend-panel__status strong { color: var(--accent-strong); }
.backend-panel__note { margin: 8px 0 0; color: var(--text-muted); font-size: 11px; line-height: 1.5; }
</style>
