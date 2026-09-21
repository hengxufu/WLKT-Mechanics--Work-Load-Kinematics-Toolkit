import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { createDefaultSpaceFrameExample } from '@/utils/defaultExamples';
import { createEmptyStructuralModel } from '@/utils/structuralModel';
import { parseStructuralProject, serializeStructuralProject } from '@/utils/structuralProject';

const project = () => JSON.parse(serializeStructuralProject(createDefaultSpaceFrameExample(5)));

describe('3D project files', () => {
  it('round trips a reactive frame with constraints, moments, releases and local axes', () => {
    const model = reactive(createDefaultSpaceFrameExample(5));
    model.members[0].localAxis = { referenceVector: { x: 0, y: 1, z: 0 }, rollAngle: 0.2 };
    model.members[0].releases = { end: { rz: true } };
    model.nodes[0].prescribedDisplacement = { uz: 0.001 };
    const restored = parseStructuralProject(JSON.parse(serializeStructuralProject(model)));
    expect(restored).toEqual(model);
    restored.nodes[0].x = 42;
    expect(model.nodes[0].x).not.toBe(42);
  });

  it('allows empty drafts and unfinished physical models to be saved for editing', () => {
    const model = createEmptyStructuralModel('space-truss');
    expect(parseStructuralProject(JSON.parse(serializeStructuralProject(model)))).toEqual(model);
    const file = project();
    file.model.members[0].endNodeId = 'not-added-yet';
    expect(() => parseStructuralProject(file)).not.toThrow();
  });

  it.each([
    ['future schema', (f: any) => { f.schemaVersion = 99; }],
    ['mismatched model type', (f: any) => { f.modelType = 'space-truss'; }],
    ['invalid revision', (f: any) => { f.model.revision = -1; }],
    ['missing array', (f: any) => { delete f.model.sections; }],
    ['duplicate IDs', (f: any) => { f.model.nodes.push(f.model.nodes[0]); }],
    ['non-finite coordinate', (f: any) => { f.model.nodes[0].z = NaN; }],
    ['invalid constraints', (f: any) => { f.model.nodes[0].constraints.uz = 'true'; }],
    ['invalid material', (f: any) => { f.model.materials[0].elasticModulus = null; }],
    ['invalid section', (f: any) => { f.model.sections[0].iy = '1'; }],
    ['invalid member', (f: any) => { f.model.members[0].type = 'solid'; }],
    ['invalid load vector', (f: any) => { f.model.nodalLoads[0].force = null; }],
    ['invalid release', (f: any) => { f.model.members[0].releases = { end: { unknown: true } }; }],
  ])('rejects %s without mutating its input', (_name, mutate) => {
    const file = project();
    mutate(file);
    const before = structuredClone(file);
    expect(() => parseStructuralProject(file)).toThrow();
    expect(file).toEqual(before);
  });
});
