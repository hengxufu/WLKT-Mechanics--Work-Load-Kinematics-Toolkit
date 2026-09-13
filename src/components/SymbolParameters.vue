<template>
  <div class="symbol-parameters" :style="`height: ${props.height}px`">
    <div class="symbol-parameters__toolbar">
      <v-btn size="small" variant="text" @click.stop="symbolStore.addParameter">
        <v-icon small>mdi-plus</v-icon> {{ $t('symbols.add') }}
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        @click.stop="symbolStore.resetDefaults"
      >
        <v-icon small>mdi-restore</v-icon> {{ $t('symbols.reset') }}
      </v-btn>
      <span class="symbol-parameters__hint d-none d-md-inline">{{ $t('symbols.examples') }}</span>
    </div>

    <div class="symbol-parameters__body" :style="`height: ${props.height - 30}px`">
      <table class="symbol-parameters__table">
        <thead>
          <tr>
            <th>{{ $t('symbols.symbol') }}</th>
            <th>{{ $t('symbols.value') }}</th>
            <th>{{ $t('symbols.description') }}</th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(parameter, index) in symbolStore.parameters" :key="index">
            <td>
              <input v-model="parameter.symbol" class="inline-edit symbol-parameters__symbol" />
            </td>
            <td>
              <input
                :value="parameter.value"
                class="inline-edit symbol-parameters__value"
                @keydown="checkNumber($event)"
                @change="updateValue(parameter, $event.target as HTMLInputElement)"
              />
            </td>
            <td>
              <input v-model="parameter.description" class="inline-edit symbol-parameters__description" />
            </td>
            <td>
              <v-btn
                density="compact"
                variant="text"
                icon="mdi-close"
                @click.stop="symbolStore.removeParameter(index)"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { checkNumber } from '@/utils';
import { evaluateNumericExpression } from '@/utils/expression';
import { type SymbolParameter, useSymbolStore } from '@/store/symbols';

const props = defineProps({
  height: {
    type: Number,
    default: 180,
  },
});

const symbolStore = useSymbolStore();

const updateValue = (parameter: SymbolParameter, el: HTMLInputElement) => {
  try {
    parameter.value = evaluateNumericExpression(el.value);
    el.value = `${parameter.value}`;
  } catch {
    el.value = `${parameter.value}`;
  }
};
</script>

<style scoped>
.symbol-parameters {
  overflow: hidden;
  background: var(--bg-panel);
  color: var(--text-primary);
}

.symbol-parameters__toolbar {
  display: flex;
  align-items: center;
  min-height: 31px;
  padding: 1px 6px;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-toolbar);
}

.symbol-parameters__toolbar :deep(.v-btn) {
  height: 27px;
  border-right: 1px solid var(--border-default);
  border-radius: 0;
  color: var(--text-secondary);
  font-size: 11px;
}

.symbol-parameters__toolbar :deep(.v-btn:hover) {
  background: var(--bg-control-hover);
  color: var(--accent-strong);
}

.symbol-parameters__hint { color: var(--text-muted); font-size: 11px; }
.symbol-parameters__body { overflow: auto; }
.symbol-parameters__table { width: 100%; border-collapse: collapse; font-size: 12px; }
.symbol-parameters__table th,
.symbol-parameters__table td { height: 32px; padding: 3px 8px; border-bottom: 1px solid var(--border-default); text-align: left; white-space: nowrap; }
.symbol-parameters__table th { position: sticky; top: 0; z-index: 1; background: var(--bg-elevated); color: var(--text-secondary); font-size: 10px; font-weight: 700; }
.symbol-parameters__table tbody tr:nth-child(even) { background: color-mix(in srgb, var(--bg-toolbar) 52%, transparent); }
.symbol-parameters__table tbody tr:hover { background: var(--bg-hover); }
.symbol-parameters__table td:last-child { width: 42px; text-align: center; }

.symbol-parameters :deep(input.inline-edit) {
  height: 25px;
  padding: 2px 7px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  caret-color: var(--accent-strong);
  box-sizing: border-box;
  outline: none;
}

.symbol-parameters :deep(input.inline-edit:hover) { border-color: var(--border-default); background: var(--bg-input); }
.symbol-parameters :deep(input.inline-edit:focus) { border-color: var(--accent); background: var(--bg-input); box-shadow: 0 0 0 3px var(--focus-ring); }
.symbol-parameters__symbol { width: 96px; color: var(--accent-strong) !important; font-family: var(--font-mono); font-weight: 700; }
.symbol-parameters__value { width: 160px; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.symbol-parameters__description { min-width: 260px; }
.symbol-parameters :deep(.v-btn--icon) { color: var(--text-muted); }
.symbol-parameters :deep(.v-btn--icon:hover) { color: var(--danger); }
</style>
