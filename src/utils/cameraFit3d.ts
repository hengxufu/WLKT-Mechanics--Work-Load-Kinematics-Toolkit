import { Box3, OrthographicCamera, PerspectiveCamera, Sphere, Vector3 } from 'three';

export const fitCameraToBounds = (
  camera: PerspectiveCamera | OrthographicCamera,
  bounds: Box3,
  direction = new Vector3(1, 0.75, 1)
): Vector3 => {
  const sphere = bounds.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, 0.1);
  const padding = 1.35;
  let distance = radius * 3;
  if (camera instanceof PerspectiveCamera) {
    const verticalHalfFov = camera.getEffectiveFOV() * Math.PI / 360;
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
    distance = radius * padding / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov));
  } else {
    camera.zoom = Math.min(camera.right - camera.left, camera.top - camera.bottom) / (2 * radius * padding);
  }
  camera.near = Math.max(radius * 1e-4, 1e-6);
  camera.far = Math.max(distance + radius * 5, camera.near * 100);
  camera.position.copy(sphere.center).addScaledVector(direction.clone().normalize(), distance);
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return sphere.center;
};
