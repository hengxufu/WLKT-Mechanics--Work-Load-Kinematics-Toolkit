import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type SymbolParameter = {
  symbol: string;
  value: number;
  description: string;
};

export const defaultSymbolParameters: SymbolParameter[] = [
  { symbol: 'F', value: 10, description: 'Force / 集中力' },
  { symbol: 'P', value: 10, description: 'Point load / 节点力' },
  { symbol: 'q', value: 5, description: 'Distributed load / 均布荷载' },
  { symbol: 'M', value: 10, description: 'Moment / 弯矩' },
  { symbol: 'E', value: 210000, description: 'Young modulus / 弹性模量' },
  { symbol: 'G', value: 80000, description: 'Shear modulus / 剪切模量' },
  { symbol: 'I', value: 1, description: 'Second moment of area / 惯性矩' },
  { symbol: 'A', value: 1, description: 'Area / 截面面积' },
  { symbol: 'L', value: 1, description: 'Length / 长度' },
  { symbol: 'k', value: 1, description: 'Stiffness / 刚度' },
  { symbol: 'sigma', value: 235, description: 'Stress or strength / 正应力或强度' },
  { symbol: 'tau', value: 120, description: 'Shear stress / 剪应力' },
  { symbol: 'fy', value: 235, description: 'Yield strength / 屈服强度' },
];

export const useSymbolStore = defineStore(
  'symbols',
  () => {
    const parameters = ref<SymbolParameter[]>(defaultSymbolParameters.map((parameter) => ({ ...parameter })));

    const scope = computed(() => {
      const values: Record<string, number> = {};

      for (const parameter of parameters.value) {
        const symbol = parameter.symbol.trim();
        const value = Number(parameter.value);

        if (!symbol || !Number.isFinite(value)) continue;

        values[symbol] = value;
        values[symbol.toLowerCase()] = value;
      }

      return values;
    });

    const addParameter = () => {
      parameters.value.push({ symbol: 'x', value: 1, description: '' });
    };

    const removeParameter = (index: number) => {
      parameters.value.splice(index, 1);
    };

    const resetDefaults = () => {
      parameters.value = defaultSymbolParameters.map((parameter) => ({ ...parameter }));
    };

    return {
      parameters,
      scope,
      addParameter,
      removeParameter,
      resetDefaults,
    };
  },
  {
    persist: {
      pick: ['parameters'],
    },
  }
);
