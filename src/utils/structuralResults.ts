import type { StructuralAnalysisModel, StructuralAnalysisResult } from '@/types/structuralAnalysis';

export type ResultTableId = 'displacements' | 'reactions' | 'members';
export type ResultCell = string | number | undefined;
export interface ResultRow {
  id: string;
  entityId: string;
  kind: 'node' | 'member';
  values: ResultCell[];
}
export interface ResultTable {
  id: ResultTableId;
  title: string;
  coordinateSystem: string;
  columns: string[];
  rows: ResultRow[];
}

const scaled = (value: number | undefined, factor: number) =>
  value === undefined || !Number.isFinite(value) ? undefined : value * factor;

export const createStructuralResultTables = (result: StructuralAnalysisResult): ResultTable[] => {
  const frame = result.modelType === 'space-frame';
  const nodes = Object.entries(result.nodeResults);
  return [
    {
      id: 'displacements', title: '位移与转角', coordinateSystem: '全局坐标系',
      columns: ['节点', 'Ux / mm', 'Uy / mm', 'Uz / mm', '|U| / mm', ...(frame ? ['Rx / rad', 'Ry / rad', 'Rz / rad'] : [])],
      rows: nodes.map(([id, { displacement: d }]) => ({
        id, entityId: id, kind: 'node',
        values: [id, scaled(d.ux, 1000), scaled(d.uy, 1000), scaled(d.uz, 1000),
          [d.ux, d.uy, d.uz].every((v) => typeof v === 'number' && Number.isFinite(v))
            ? Math.hypot(d.ux!, d.uy!, d.uz!) * 1000 : undefined,
          ...(frame ? [d.rx, d.ry, d.rz] : [])],
      })),
    },
    {
      id: 'reactions', title: '支座反力', coordinateSystem: '全局坐标系',
      columns: ['节点', 'Fx / kN', 'Fy / kN', 'Fz / kN', ...(frame ? ['Mx / kN·m', 'My / kN·m', 'Mz / kN·m'] : [])],
      rows: nodes.filter(([, node]) => node.reaction && Object.keys(node.reaction).length > 0).map(([id, { reaction: r }]) => ({
        id, entityId: id, kind: 'node',
        values: [id, scaled(r?.fx, 0.001), scaled(r?.fy, 0.001), scaled(r?.fz, 0.001),
          ...(frame ? [scaled(r?.mx, 0.001), scaled(r?.my, 0.001), scaled(r?.mz, 0.001)] : [])],
      })),
    },
    {
      id: 'members', title: frame ? '构件端力' : '杆件结果', coordinateSystem: frame ? '构件局部坐标系 · 两端节点力符号' : '构件局部坐标系',
      columns: ['构件', '位置 x/L', 'N / kN', ...(frame ? ['Vy / kN', 'Vz / kN', 'T / kN·m', 'My / kN·m', 'Mz / kN·m'] : ['σ / MPa', '安全系数'])],
      rows: Object.entries(result.memberResults).flatMap(([id, member]) => member.stations.map((s, index) => ({
        id: `${id}:${index}`, entityId: id, kind: 'member' as const,
        values: [id, s.position, scaled(s.axialForce, 0.001), ...(frame
          ? [scaled(s.shearY, 0.001), scaled(s.shearZ, 0.001), scaled(s.torsion, 0.001), scaled(s.bendingY, 0.001), scaled(s.bendingZ, 0.001)]
          : [scaled(s.normalStress, 1e-6), s.safetyFactor])],
      }))),
    },
  ];
};

export const formatResultNumber = (value: ResultCell): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || Number.isNaN(value)) return '—';
  if (value === Infinity) return '∞';
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return Math.abs(value) < 0.001 || Math.abs(value) >= 1e6 ? value.toExponential(4) : Number(value.toPrecision(7)).toString();
};

const csvCell = (value: ResultCell): string => {
  if (value === undefined || (typeof value === 'number' && Number.isNaN(value))) return '';
  let text = String(value);
  // Node/member IDs are user input; preserve them as text when opening in spreadsheets.
  if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export const exportStructuralResultsCsv = (model: StructuralAnalysisModel, result: StructuralAnalysisResult, tableId: ResultTableId): string => {
  if (model.revision !== result.modelRevision || model.modelType !== result.modelType ||
      !result.convergence.converged || result.diagnostics.errors.length > 0) {
    throw new Error('当前模型没有有效的求解结果，请重新求解。');
  }
  const table = createStructuralResultTables(result).find((item) => item.id === tableId)!;
  const rows: ResultCell[][] = [
    ['模型类型', model.modelType, '模型修订号', model.revision],
    ['结果', table.title, '坐标与符号', table.coordinateSystem],
    table.columns, ...table.rows.map((row) => row.values),
  ];
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
};
