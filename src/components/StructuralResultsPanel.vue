<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStructuralStore } from '@/store/structural';
import { download } from '@/utils';
import { createStructuralResultTables, exportStructuralResultsCsv, formatResultNumber, type ResultRow, type ResultTableId } from '@/utils/structuralResults';
import StructuralResultTable from './StructuralResultTable.vue';

const store = useStructuralStore();
const activeTab = ref<ResultTableId>('displacements');
const expanded = ref(false);
const result = computed(() => store.resultIsCurrent && store.result?.convergence.converged && !store.result.diagnostics.errors.length ? store.result : null);
const tables = computed(() => result.value ? createStructuralResultTables(result.value) : []);
watch(result, (value) => { if (!value) expanded.value = false; });
const maximumDisplacement = computed(() => tables.value[0]?.rows.reduce<ResultRow | undefined>((maximum, row) =>
  typeof row.values[4] === 'number' && (!maximum || Number(row.values[4]) > Number(maximum.values[4])) ? row : maximum, undefined));
const selectRow = (row: ResultRow) => {
  store.selectedNodeId = row.kind === 'node' ? row.entityId : null;
  store.selectedMemberId = row.kind === 'member' ? row.entityId : null;
};
const exportCsv = () => {
  if (result.value) download(`results-${store.model.modelType}-rev${store.model.revision}-${activeTab.value}.csv`, exportStructuralResultsCsv(store.model, result.value, activeTab.value));
};
</script>

<template>
  <section class="spatial-results" aria-label="三维计算结果">
    <div v-if="!result" class="spatial-results__empty" role="status">
      <v-icon size="28">mdi-chart-box-outline</v-icon>
      <p>{{ store.resultIsStale ? '模型已修改，请重新求解。' : '暂无有效结果，请先完成本地求解。' }}</p>
    </div>
    <template v-else>
      <dl class="result-summary">
        <div><dt>最大节点位移</dt><dd>{{ formatResultNumber(maximumDisplacement?.values[4]) }} <small>mm</small></dd><span>节点 {{ maximumDisplacement?.entityId ?? '—' }}</span></div>
        <div><dt>相对残差</dt><dd>{{ result.convergence.relativeResidual.toExponential(2) }}</dd><span>修订 {{ result.modelRevision }}</span></div>
      </dl>
      <div class="result-actions">
        <span>计算结果</span>
        <v-btn icon="mdi-arrow-expand" variant="text" size="small" title="展开结果表" aria-label="展开结果表" @click="expanded = true" />
        <v-btn icon="mdi-download" variant="text" size="small" title="导出当前表格 CSV" aria-label="导出当前表格 CSV" @click="exportCsv" />
      </div>
    </template>
    <StructuralResultTable v-if="result && !expanded" v-model="activeTab" :tables="tables" @select="selectRow" />
    <v-dialog v-model="expanded" max-width="1120" aria-label="三维结果表">
      <section v-if="result" class="result-dialog">
        <header class="result-actions"><strong>三维计算结果 · 修订 {{ result.modelRevision }}</strong><v-btn icon="mdi-download" size="small" variant="text" title="导出当前表格 CSV" aria-label="导出当前表格 CSV" @click="exportCsv" /><v-btn icon="mdi-close" size="small" variant="text" title="关闭结果表" aria-label="关闭结果表" @click="expanded = false" /></header>
        <StructuralResultTable v-model="activeTab" :tables="tables" @select="selectRow" />
      </section>
    </v-dialog>
  </section>
</template>

<style scoped>
.spatial-results { min-width: 0; color: var(--text-primary); }
.spatial-results__empty { padding: 30px 8px; text-align: center; color: var(--text-muted); font-size: 12px; }
.result-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0 0 12px; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-default); }
.result-summary dt, .result-summary span { color: var(--text-muted); font-size: 11px; }
.result-summary dd { margin: 6px 0; color: var(--accent-strong); font: 16px var(--font-mono); overflow-wrap: anywhere; }
.result-summary small { font-size: 11px; }
.result-actions { display: flex; align-items: center; gap: 4px; min-height: 38px; }
.result-actions > :first-child { flex: 1; font-size: 13px; }
.result-dialog { max-height: calc(100dvh - 48px); overflow: auto; padding: 16px; background: var(--bg-panel); color: var(--text-primary); border: 1px solid var(--border-strong); border-radius: 6px; }
</style>
