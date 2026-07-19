import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type SymbolParameter = {
  symbol: string;
  value: number;
  description: string;
};

export const defaultSymbolParameters: SymbolParameter[] = [
  { symbol: 'F', value: 10000, description: 'concentrated force' },
  { symbol: 'P', value: 10000, description: 'point load' },
  { symbol: 'q', value: 5000, description: 'distributed load' },
  { symbol: 'N', value: 10000, description: 'axial force' },
  { symbol: 'V', value: 5000, description: 'shear force' },
  { symbol: 'M', value: 2000, description: 'bending moment' },
  { symbol: 'T', value: 1000, description: 'torque' },
  { symbol: 'E', value: 210e9, description: 'Young modulus' },
  { symbol: 'G', value: 80e9, description: 'shear modulus' },
  { symbol: 'A', value: 2e-3, description: 'section area' },
  { symbol: 'I', value: 8e-6, description: 'second moment of area' },
  { symbol: 'J', value: 1.6e-5, description: 'torsion constant' },
  { symbol: 'W', value: 4e-5, description: 'bending section modulus' },
  { symbol: 'Wt', value: 8e-5, description: 'torsion section modulus' },
  { symbol: 'L', value: 1.5, description: 'member length' },
  { symbol: 'k', value: 1e6, description: 'spring stiffness' },
  { symbol: 'alpha', value: 12e-6, description: 'thermal expansion coefficient' },
  { symbol: 'dT', value: 35, description: 'temperature change' },
  { symbol: 'sigma', value: 235e6, description: 'normal stress or strength' },
  { symbol: 'tau', value: 120e6, description: 'shear stress or strength' },
  { symbol: 'fy', value: 235e6, description: 'yield strength' },
  { symbol: 'L3D', value: 2, description: '3D member length' },
  { symbol: 'E3D', value: 210e9, description: '3D Young modulus' },
  { symbol: 'G3D', value: 80e9, description: '3D shear modulus' },
  { symbol: 'fy3D', value: 235e6, description: '3D yield strength' },
  { symbol: 'A3D', value: 0.01, description: '3D section area' },
  { symbol: 'Iy3D', value: 1e-5, description: '3D local y second moment' },
  { symbol: 'Iz3D', value: 2e-5, description: '3D local z second moment' },
  { symbol: 'J3D', value: 3e-5, description: '3D torsion constant' },
  { symbol: 'Wy3D', value: 2e-4, description: '3D y section modulus' },
  { symbol: 'Wz3D', value: 4e-4, description: '3D z section modulus' },
  { symbol: 'Wt3D', value: 3e-4, description: '3D torsion section modulus' },
  { symbol: 'Fx3D', value: 10000, description: '3D x force' },
  { symbol: 'Fy3D', value: 5000, description: '3D y force' },
  { symbol: 'Fz3D', value: 3000, description: '3D z force' },
  { symbol: 'Tx3D', value: 2000, description: '3D x torque' },
];

export const useSymbolStore = defineStore(
  'symbols',
  () => {
    const parameters = ref<SymbolParameter[]>(defaultSymbolParameters.map((parameter) => ({ ...parameter })));

    const scope = computed(() => {
      const values: Record<string, number> = {};

      for (const parameter of defaultSymbolParameters) {
        values[parameter.symbol] = parameter.value;
        values[parameter.symbol.toLowerCase()] = parameter.value;
      }

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
