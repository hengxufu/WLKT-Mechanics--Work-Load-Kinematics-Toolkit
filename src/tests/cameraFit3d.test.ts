import { describe, expect, it } from 'vitest';
import { Box3, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { fitCameraToBounds } from '@/utils/cameraFit3d';

describe('3D camera fit', () => {
  it.each([0.3, 1, 2.4])('keeps complete model bounds visible at aspect %s in both projections', (aspect) => {
    const bounds = new Box3(new Vector3(-2, -1, -3), new Vector3(10, 4, 8));
    for (const camera of [new PerspectiveCamera(45, aspect), new OrthographicCamera(-4 * aspect, 4 * aspect, 4, -4)]) {
      expect(fitCameraToBounds(camera, bounds).distanceTo(bounds.getCenter(new Vector3()))).toBeLessThan(1e-10);
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new Vector3(x, y, z).project(camera);
        expect(Math.abs(point.x)).toBeLessThan(1);
        expect(Math.abs(point.y)).toBeLessThan(1);
        expect(Math.abs(point.z)).toBeLessThan(1);
      }
    }
  });

  it('fits a single point without a zero distance or invalid clip range', () => {
    const point = new Vector3(1e6, -1e6, 1e6);
    const camera = new PerspectiveCamera(45, 1);
    fitCameraToBounds(camera, new Box3(point.clone(), point.clone()));
    expect(camera.position.distanceTo(point)).toBeGreaterThan(0);
    expect(camera.near).toBeGreaterThan(0);
    expect(camera.far).toBeGreaterThan(camera.near);
    expect(point.clone().project(camera).length()).toBeLessThan(1);
  });
});
