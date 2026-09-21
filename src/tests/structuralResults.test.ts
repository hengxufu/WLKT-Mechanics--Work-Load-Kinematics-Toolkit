import { describe, expect, it } from 'vitest';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';
import { solveStructuralAnalysis } from '@/utils/structuralAdapters';
import { createStructuralResultTables, exportStructuralResultsCsv, formatResultNumber } from '@/utils/structuralResults';

describe('structural result tables', () => {
  it('keeps rotations, reaction moments and both frame ends with explicit units', () => {
    const result = solveStructuralAnalysis(createDefaultSpaceFrameExample());
    const [displacements, reactions, members] = createStructuralResultTables(result);
    expect(displacements.columns).toContain('Rx / rad');
    const d = displacements.rows.find((row) => row.entityId === 'D')!;
    expect(d.values[3]).toBeCloseTo(result.nodeResults.D.displacement.uz! * 1000);
    expect(d.values[5]).toBe(result.nodeResults.D.displacement.rx);
    const a = reactions.rows.find((row) => row.entityId === 'A')!;
    expect(a.values[1]).toBeCloseTo(result.nodeResults.A.reaction!.fx! / 1000);
    expect(a.values[4]).toBeCloseTo(result.nodeResults.A.reaction!.mx! / 1000);
    expect(members.rows).toHaveLength(6);
    expect(members.rows.slice(0, 2).map((row) => row.values[1])).toEqual([0, 1]);
    expect(members.coordinateSystem).toContain('两端节点力');
    expect(members.rows[1].values[7]).toBeCloseTo(Object.values(result.memberResults)[0].stations[1].bendingZ! / 1000);
  });

  it('does not invent inactive truss rotations or missing stresses', () => {
    const result = solveStructuralAnalysis(createDefaultSpaceFrameExample());
    result.modelType = 'space-truss';
    result.memberResults = { AB: { stations: [{ position: 0, axialForce: 0 }] } };
    const [displacements, , members] = createStructuralResultTables(result);
    expect(displacements.columns).not.toContain('Rx / rad');
    expect(members.rows[0].values).toEqual(['AB', 0, 0, undefined, undefined]);
    expect(formatResultNumber(undefined)).toBe('—');
    expect(formatResultNumber(0)).toBe('0');
    expect(formatResultNumber(Infinity)).toBe('∞');
    expect(formatResultNumber(NaN)).toBe('—');
  });

  it('exports precise UTF-8 CSV with units, quoted IDs and spreadsheet formula protection', () => {
    const model = createDefaultSpaceFrameExample(9);
    const result = solveStructuralAnalysis(model);
    result.nodeResults = { '=SUM(1,2)"': { displacement: { ux: -0.00123456789, uy: 0, uz: 0 } } };
    const csv = exportStructuralResultsCsv(model, result, 'displacements');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"模型修订号","9"');
    expect(csv).toContain('"Ux / mm"');
    expect(csv).toContain('"\'=SUM(1,2)"""');
    expect(csv).toContain('"-1.23456789"');
    expect(csv).toContain('\r\n');
  });

  it('refuses exports for stale, mismatched or failed results', () => {
    const model = createDefaultSpaceFrameExample(9);
    const result = solveStructuralAnalysis(model);
    for (const invalid of [
      { ...result, modelRevision: 8 },
      { ...result, modelType: 'space-truss' as const },
      { ...result, convergence: { ...result.convergence, converged: false } },
      { ...result, diagnostics: { errors: ['failed'], warnings: [] } },
    ]) expect(() => exportStructuralResultsCsv(model, invalid, 'members')).toThrow('请重新求解');
  });
});
