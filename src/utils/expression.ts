import { evaluate } from 'mathjs';
import { useSymbolStore } from '@/store/symbols';

const allowedExpression = /^[0-9A-Za-z_+\-*/^().,\s]+$/;

export const normalizeNumericExpression = (input: string) => {
  const scientificNumbers: string[] = [];
  const expression = input
    .trim()
    .replaceAll(/\s/g, '')
    .replaceAll(',', '.')
    .replace(/((?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+)/g, (value) => {
      scientificNumbers.push(value);
      return `#${scientificNumbers.length - 1}#`;
    })
    .replace(/(\d|\))(?=[A-Za-z_])/g, '$1*')
    .replace(/([A-Za-z_][A-Za-z0-9_]*|\))(?=\()/g, '$1*');

  return scientificNumbers.reduce(
    (currentExpression, value, index) => currentExpression.replace(`#${index}#`, value),
    expression
  );
};

export const evaluateNumericExpression = (input: string | number, scope?: Record<string, number>) => {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Expression result is not finite.');
    return input;
  }

  const raw = `${input}`;

  if (raw.trim() === '' || raw.trim() === '-') return 0;
  if (!allowedExpression.test(raw)) throw new Error('Expression contains unsupported characters.');

  const expression = normalizeNumericExpression(raw);
  const symbols = scope ?? useSymbolStore().scope;
  const result = evaluate(expression, symbols);
  const value = typeof result === 'number' ? result : Number(result);

  if (!Number.isFinite(value)) throw new Error('Expression result is not finite.');

  return value;
};

export const isNumericExpression = (input: string | number) => {
  try {
    evaluateNumericExpression(input);
    return true;
  } catch {
    return false;
  }
};
