<script setup lang="ts">
import { computed } from 'vue';
import { useStructuralStore } from '@/store/structural';
import { formatResultNumber, type ResultRow, type ResultTable, type ResultTableId } from '@/utils/structuralResults';

const props = defineProps<{ tables: ResultTable[] }>();
const activeTab = defineModel<ResultTableId>({ required: true });
const emit = defineEmits<{ select: [row: ResultRow] }>();
const store = useStructuralStore();
const table = computed(() => props.tables.find((item) => item.id === activeTab.value));
</script>

<template>
  <div class="result-table">
    <v-tabs v-model="activeTab" density="compact" grow aria-label="三维结果类型">
      <v-tab v-for="item in tables" :key="item.id" :value="item.id">{{ item.title }}</v-tab>
    </v-tabs>
    <p class="result-coordinate">{{ table?.coordinateSystem }}</p>
    <div class="result-table-scroll" tabindex="0" aria-label="结果数据">
      <table v-if="table">
        <thead><tr><th v-for="column in table.columns" :key="column" scope="col">{{ column }}</th></tr></thead>
        <tbody><tr v-for="row in table.rows" :key="row.id" :class="{ selected: row.kind === 'node' ? store.selectedNodeId === row.entityId : store.selectedMemberId === row.entityId }">
          <td v-for="(value, index) in row.values" :key="index"><button v-if="index === 0" :title="`高亮${row.kind === 'node' ? '节点' : '构件'} ${row.entityId}`" @click="emit('select', row)">{{ value }}</button><template v-else>{{ formatResultNumber(value) }}</template></td>
        </tr><tr v-if="table.rows.length === 0"><td :colspan="table.columns.length">无对应结果</td></tr></tbody>
      </table>
    </div>
    <p class="result-coordinate">{{ table?.id === 'members' && store.model.modelType === 'space-frame' ? 'x/L = 0 为起端，1 为终端；端力采用各端局部节点力符号。' : '— 表示该分量未提供或不适用。' }}</p>
  </div>
</template>

<style scoped>
.result-table { min-width: 0; }
.result-coordinate { margin: 8px 0; font-size: 11px; color: var(--text-muted); }
.result-table-scroll { overflow: auto; max-height: 65vh; border: 1px solid var(--border-default); }
table { border-collapse: collapse; width: 100%; font: 11px var(--font-mono); white-space: nowrap; }
th, td { padding: 9px 10px; text-align: right; border-bottom: 1px solid var(--border-default); }
th { position: sticky; top: 0; background: var(--bg-toolbar); color: var(--text-secondary); font-weight: 600; }
th:first-child, td:first-child { text-align: left; }
td button { color: var(--accent-strong); text-decoration: underline; cursor: pointer; }
tr.selected, tbody tr:hover { background: var(--bg-selected); }
.result-table :deep(.v-tab) { min-width: 0; padding: 0 6px; font-size: 11px; }
</style>
