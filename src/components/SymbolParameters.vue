<template>
  <div class="symbol-parameters" :style="`height: ${props.height}px`">
    <div class="border-b border-t">
      <v-btn size="small" variant="flat" color="secondary" :rounded="0" @click.stop="symbolStore.addParameter">
        <v-icon small>mdi-plus</v-icon> {{ $t('symbols.add') }}
      </v-btn>
      <v-btn
        size="small"
        variant="flat"
        color="secondary"
        style="border-left: 1px solid #ccc"
        :rounded="0"
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
