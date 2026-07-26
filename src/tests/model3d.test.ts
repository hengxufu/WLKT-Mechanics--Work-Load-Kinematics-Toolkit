import { describe, expect, it } from 'vitest';
import {
  calculateAutoDeformationScale,
  createMemberLocalAxes3D,
  globalToLocalVector3,
  legacyCoordsToNode3D,
  localToGlobalVector3,
  vector3,
} from '@/utils/model3d';

describe('3D model helpers', () => {
  it('maps legacy XZ nodes onto the global XY display plane', () => {
    expect(legacyCoordsToNode3D('n1', [2, 99, -4])).toEqual({ id: 'n1', x: 2, y: -4, z: 0 });
  });

  it('builds a stable right-handed local axis system for vertical members', () => {
    const axes = createMemberLocalAxes3D(vector3(0, 0, 0), vector3(0, 4, 0));
    expect(axes.x).toEqual(vector3(0, 1, 0));
    expect(Math.abs(axes.y.x) + Math.abs(axes.y.y) + Math.abs(axes.y.z)).toBeCloseTo(1);
    expect(Math.abs(axes.z.x) + Math.abs(axes.z.y) + Math.abs(axes.z.z)).toBeCloseTo(1);
  });

  it('round-trips vectors between local and global systems', () => {
    const axes = createMemberLocalAxes3D(vector3(0, 0, 0), vector3(1, 2, 3), Math.PI / 6);
    const local = vector3(4, -2, 1);
    const global = localToGlobalVector3(local, axes);
    const restored = globalToLocalVector3(global, axes);
    expect(restored.x).toBeCloseTo(local.x);
    expect(restored.y).toBeCloseTo(local.y);
    expect(restored.z).toBeCloseTo(local.z);
  });

  it('returns a readable automatic deformation scale', () => {
    const scale = calculateAutoDeformationScale(
      [legacyCoordsToNode3D('1', [0, 0, 0]), legacyCoordsToNode3D('2', [5, 0, 0])],
      [{ nodeId: '2', translation: vector3(0, 0.01, 0), rotation: vector3() }]
    );
    expect(scale).toBeGreaterThan(1);
  });
});
