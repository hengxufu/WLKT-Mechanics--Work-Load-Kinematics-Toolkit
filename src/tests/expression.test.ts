import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { evaluateNumericExpression, isNumericExpression } from '@/utils/expression';
import { useSymbolStore } from '@/store/symbols';

describe('numeric expression support', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('evaluates common mechanics symbols locally', () => {
    const symbolStore = useSymbolStore();
    symbolStore.parameters.find((parameter) => parameter.symbol === 'F')!.value = 12;
    symbolStore.parameters.find((parameter) => parameter.symbol === 'M')!.value = 24;
    symbolStore.parameters.find((parameter) => parameter.symbol === 'L')!.value = 3;

    expect(evaluateNumericExpression('2F')).toBe(24);
    expect(evaluateNumericExpression('M/L')).toBe(8);
  });

  it('supports stiffness and strength expressions', () => {
    const symbolStore = useSymbolStore();
    symbolStore.parameters.find((parameter) => parameter.symbol === 'E')!.value = 210000;
    symbolStore.parameters.find((parameter) => parameter.symbol === 'I')!.value = 8;
    symbolStore.parameters.find((parameter) => parameter.symbol === 'L')!.value = 2;
    symbolStore.parameters.find((parameter) => parameter.symbol === 'fy')!.value = 235;

    expect(evaluateNumericExpression('E*I/L^3')).toBe(210000);
    expect(evaluateNumericExpression('0.6fy')).toBe(141);
  });

  it('preserves scientific notation used by engineering inputs', () => {
    expect(evaluateNumericExpression('2.1e5')).toBe(210000);
    expect(evaluateNumericExpression('1e-3')).toBe(0.001);
  });

  it('rejects unsupported characters and unknown symbols', () => {
    expect(isNumericExpression('fetch(1)')).toBe(false);
    expect(isNumericExpression('unknownSymbol + 1')).toBe(false);
  });
});
