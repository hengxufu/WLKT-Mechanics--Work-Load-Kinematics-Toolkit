import { toRaw } from 'vue';
import type { StructuralAnalysisModel, VersionedProjectFile } from '@/types/structuralAnalysis';
import { STRUCTURAL_SCHEMA_VERSION } from './structuralModel';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string => typeof value === 'string';
const vector = (value: unknown) => record(value) && ['x', 'y', 'z'].every((key) => finite(value[key]));
const dofs = ['ux', 'uy', 'uz', 'rx', 'ry', 'rz'];
const optionalNumbers = (value: RecordValue, keys: string[]) => keys.every((key) => value[key] === undefined || finite(value[key]));
const partialDofs = (value: unknown, check: (value: unknown) => boolean) =>
  value === undefined || (record(value) && Object.entries(value).every(([key, item]) => dofs.includes(key) && check(item)));

export const parseStructuralProject = (value: unknown): StructuralAnalysisModel => {
  const invalid = () => { throw new Error('三维工程文件格式无效，当前模型未被替换。'); };
  if (!record(value)) return invalid();
  if (value.schemaVersion !== STRUCTURAL_SCHEMA_VERSION) throw new Error('不支持该三维工程文件版本。');
  const model = value.model;
  if (!record(model) || model.schemaVersion !== value.schemaVersion || model.modelType !== value.modelType ||
      !['space-truss', 'space-frame'].includes(String(model.modelType)) || !Number.isSafeInteger(model.revision) || Number(model.revision) < 0) return invalid();

  const collection = (key: string, check: (row: RecordValue) => boolean) => {
    const rows = model[key];
    if (!Array.isArray(rows)) return false;
    const ids = new Set<string>();
    return rows.every((row: unknown) => {
      if (!record(row) || !text(row.id) || !row.id.trim() || ids.has(row.id) || !check(row)) return false;
      ids.add(row.id);
      return true;
    });
  };
  if (!collection('nodes', (n) => vector(n) && record(n.constraints) && dofs.every((key) => typeof (n.constraints as RecordValue)[key] === 'boolean') && partialDofs(n.prescribedDisplacement, finite)) ||
      !collection('materials', (m) => text(m.name) && finite(m.elasticModulus) && optionalNumbers(m, ['shearModulus', 'poissonRatio', 'density', 'yieldStrength'])) ||
      !collection('sections', (s) => text(s.name) && finite(s.area) && optionalNumbers(s, ['iy', 'iz', 'torsionConstant', 'shearAreaY', 'shearAreaZ'])) ||
      !collection('members', (m) => m.type === (model.modelType === 'space-frame' ? 'frame3d' : 'truss3d') && text(m.startNodeId) && text(m.endNodeId) && text(m.materialId) && text(m.sectionId) &&
        (m.localAxis === undefined || (record(m.localAxis) && optionalNumbers(m.localAxis, ['rollAngle']) && (m.localAxis.referenceVector === undefined || vector(m.localAxis.referenceVector)))) &&
        (m.releases === undefined || (record(m.releases) && partialDofs(m.releases.start, (v) => typeof v === 'boolean') && partialDofs(m.releases.end, (v) => typeof v === 'boolean')))) ||
      !collection('nodalLoads', (l) => text(l.nodeId) && text(l.loadCaseId) && vector(l.force) && vector(l.moment) && ['global', 'local'].includes(String(l.coordinateSystem)))) return invalid();

  // Incomplete but well-formed models remain editable; solver validation handles physical consistency.
  return structuredClone(toRaw(model)) as unknown as StructuralAnalysisModel;
};

export const serializeStructuralProject = (model: StructuralAnalysisModel): string => {
  const file: VersionedProjectFile = { schemaVersion: STRUCTURAL_SCHEMA_VERSION, modelType: model.modelType, model: toRaw(model) };
  parseStructuralProject(file);
  return JSON.stringify(file, null, 2);
};
