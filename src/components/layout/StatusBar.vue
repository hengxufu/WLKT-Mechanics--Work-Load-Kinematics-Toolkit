<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useSolverStore } from '@/store/solver';
import { useStructuralStore } from '@/store/structural';
import { useWorkspaceStore } from '@/store/workspace';

const appStore = useAppStore();
const projectStore = useProjectStore();
const solverStore = useSolverStore();
const structuralStore = useStructuralStore();
const workspaceStore = useWorkspaceStore();
const fps = ref(60);
let frame = 0;
let lastSample = performance.now();
let animationFrame = 0;

const isPlanar = computed(() => workspaceStore.analysisDimension === '2d');
const nodes = computed(() => isPlanar.value ? projectStore.solver.domain.nodes.size : structuralStore.model.nodes.length);
const elements = computed(() => isPlanar.value ? projectStore.solver.domain.elements.size : structuralStore.model.members.length);
const dof = computed(() => isPlanar.value ? (projectStore.solver.neq || nodes.value * 3) : nodes.value * structuralStore.capabilities.nodeDofs.length);
const status = computed(() => {
  if (solverStore.isSolving) return solverStore.progress.stage || '正在求解';
  if (solverStore.lastError) return '求解器错误';
  if (isPlanar.value && projectStore.solver.loadCases[0]?.solved) return '二维求解完成';
  if (!isPlanar.value && structuralStore.resultIsCurrent) return `求解完成 · ${solverStore.lastElapsedMs.toFixed(1)} ms`;
  return '就绪';
});

const sampleFps = (now: number) => {
  frame += 1;
  if (now - lastSample >= 1000) {
    fps.value = Math.round(frame * 1000 / (now - lastSample));
    frame = 0;
    lastSample = now;
  }
  animationFrame = requestAnimationFrame(sampleFps);
};

onMounted(() => { animationFrame = requestAnimationFrame(sampleFps); });
onBeforeUnmount(() => cancelAnimationFrame(animationFrame));
</script>

<template>
  <footer id="bottomBar" class="status-bar" aria-label="状态栏">
    <span class="status-bar__state" :class="{ solving: solverStore.isSolving, error: Boolean(solverStore.lastError) }"><v-icon size="12">{{ solverStore.lastError ? 'mdi-alert-circle-outline' : solverStore.isSolving ? 'mdi-progress-clock' : 'mdi-check-circle-outline' }}</v-icon>{{ status }}</span>
    <button title="单位设置" @click="appStore.openSettings()">{{ appStore.units.Force }} · {{ appStore.units.Length }}</button>
    <span>Nodes: <b>{{ nodes }}</b></span><span>Elements: <b>{{ elements }}</b></span><span>DOF: <b>{{ dof }}</b></span>
    <span class="status-bar__spacer" />
    <span>{{ workspaceStore.currentAnalysisLabel }}</span>
    <span><v-icon size="12">mdi-chip</v-icon>{{ solverStore.backendLabel }}</span>
    <span>{{ solverStore.capability?.deviceAvailable ? 'GPU Ready' : 'CPU' }}</span>
    <span class="cae-number">{{ fps }} FPS</span>
  </footer>
</template>

<style scoped>
.status-bar { display: flex; flex: 0 0 var(--statusbar-height); align-items: center; gap: 0; min-width: 0; border-top: 1px solid var(--border-default); background: #1d2228; color: #aeb8c4; font-size: 10px; user-select: none; }
[data-cae-theme='light'] .status-bar { background: #283441; color: #d4dae1; }
.status-bar > span, .status-bar > button { display: inline-flex; align-items: center; gap: 4px; height: 100%; padding: 0 8px; border: 0; border-right: 1px solid #343c45; background: transparent; color: inherit; font: inherit; white-space: nowrap; }
.status-bar > button { cursor: pointer; }
.status-bar > button:hover { background: #303944; color: #fff; }
.status-bar b { color: #e7ebef; font-family: var(--font-mono); font-weight: 500; }
.status-bar__state { color: var(--success) !important; }
.status-bar__state.solving { color: var(--warning) !important; }
.status-bar__state.error { color: var(--danger) !important; }
.status-bar__spacer { flex: 1 1 auto; border-right: 0 !important; }
@media (max-width: 900px) { .status-bar > span:nth-of-type(n + 5) { display: none; } }
</style>
