<script setup lang="ts">
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { eventBus, EventType } from '@/EventBus';
import { useProjectStore } from '@/store/project';
import { useStructuralStore } from '@/store/structural';
import { useUiStore } from '@/store/ui';
import { useViewerStore } from '@/store/viewer';
import { useWorkspaceStore } from '@/store/workspace';
import { createStructureSceneModel3D, calculateAutoDeformationScale, createMemberLocalAxes3D } from '@/utils/model3d';
import { createStructureSceneModelFromStructuralAnalysis } from '@/utils/structuralAdapters';
import { executeModelMutationWithUndo } from '@/utils';
import type { Member3D, Node3D, NodeConstraint3D, Vector3Data } from '@/types/model3d';

const props = withDefaults(defineProps<{ id: string; showProperties?: boolean }>(), {
  showProperties: true,
});

type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'axonometric' | 'reset';

const projectStore = useProjectStore();
const structuralStore = useStructuralStore();
const uiStore = useUiStore();
const viewerStore = useViewerStore();
const workspaceStore = useWorkspaceStore();
const host = ref<HTMLDivElement | null>(null);
const gizmoAxes = ref<HTMLDivElement | null>(null);
const renderError = ref('');
const cursorWorld = ref<Vector3Data | null>(null);
const selectedNodeCoordinates = ref({ x: 0, y: 0, z: 0 });
const manualDeformationScale = ref<number | null>(null);
const projection = computed<'perspective' | 'orthographic'>({
  get: () => workspaceStore.projection,
  set: (value) => {
    workspaceStore.projection = value;
  },
});

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let resizeObserver: ResizeObserver | null = null;
let animationFrame = 0;
let modelGroup: THREE.Group | null = null;
let hoverObject: THREE.Object3D | null = null;
let lastViewportAspect = 0;
let resizeFitTimer: ReturnType<typeof setTimeout> | null = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const modelPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const cameraTarget = new THREE.Vector3();
let cameraAnimation: { from: THREE.Vector3; to: THREE.Vector3; startedAt: number; duration: number } | null = null;

const isSpatialAnalysisActive = computed(() => workspaceStore.analysisDimension === '3d');
const structureModel = computed(() =>
  isSpatialAnalysisActive.value
    ? createStructureSceneModelFromStructuralAnalysis(structuralStore.model, structuralStore.result)
    : createStructureSceneModel3D(projectStore.solver)
);
const selectedNode = computed(() => {
  const id = isSpatialAnalysisActive.value
    ? structuralStore.selectedNodeId
    : projectStore.selection2.nodes[0];
  return id ? structureModel.value.nodes.find((node) => node.id === id) ?? null : null;
});
const selectedMember = computed(() => {
  const id = isSpatialAnalysisActive.value
    ? structuralStore.selectedMemberId
    : projectStore.selection2.elements[0];
  return id ? structureModel.value.members.find((member) => member.id === id) ?? null : null;
});
const autoDeformationScale = computed(() =>
  calculateAutoDeformationScale(structureModel.value.nodes, structureModel.value.displacements)
);
const deformationScale = computed(() => manualDeformationScale.value ?? autoDeformationScale.value);
const currentResultLabel = computed(() => {
  const labels = {
    model: '结构模型',
    normal: '轴力 N',
    shear: '剪力 V',
    moment: '弯矩 M',
    displacement: '位移',
  };
  return labels[viewerStore.threeDResultMode];
});
const resultLayerItems = computed(() => [
  { title: '结构模型', value: 'model' },
  { title: '轴力 N', value: 'normal' },
  {
    title: isSpatialAnalysisActive.value && structuralStore.model.modelType === 'space-truss' ? '剪力 V（桁架不适用）' : '剪力 V',
    value: 'shear',
    props: { disabled: isSpatialAnalysisActive.value && structuralStore.model.modelType === 'space-truss' },
  },
  {
    title: isSpatialAnalysisActive.value && structuralStore.model.modelType === 'space-truss' ? '弯矩 M（桁架不适用）' : '弯矩 M',
    value: 'moment',
    props: { disabled: isSpatialAnalysisActive.value && structuralStore.model.modelType === 'space-truss' },
  },
  { title: '位移', value: 'displacement' },
]);

const toThree = (value: Vector3Data) => new THREE.Vector3(value.x, value.y, value.z);
const toData = (value: THREE.Vector3): Vector3Data => ({ x: value.x, y: value.y, z: value.z });

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material?.dispose();
    const sprite = child as THREE.Sprite;
    if (sprite.material?.map) sprite.material.map.dispose();
  });
};

const clearModel = () => {
  if (!scene || !modelGroup) return;
  scene.remove(modelGroup);
  disposeObject(modelGroup);
  modelGroup = new THREE.Group();
  modelGroup.name = 'structure-model';
  scene.add(modelGroup);
};

const textSprite = (text: string, color = '#102a5e') => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  const dark = uiStore.theme === 'dark';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 30px "Segoe UI", Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = dark ? 'rgba(31,35,41,0.9)' : 'rgba(255,255,255,0.88)';
  context.strokeStyle = dark ? 'rgba(96,108,122,0.88)' : 'rgba(168,178,190,0.88)';
  context.lineWidth = 2;
  context.fillRect(12, 22, 232, 52);
  context.strokeRect(12, 22, 232, 52);
  context.fillStyle = dark ? '#e8edf3' : color;
  context.fillText(text, 128, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(0.42, 0.158, 1);
  return sprite;
};

const addEntity = (object: THREE.Object3D, entityType: 'node' | 'element' | 'load' | 'support', entityId: string) => {
  object.userData.entityType = entityType;
  object.userData.entityId = entityId;
  modelGroup?.add(object);
  return object;
};

const memberEndpoints = (member: Member3D) => {
  const start = structureModel.value.nodes.find((node) => node.id === member.startNodeId);
  const end = structureModel.value.nodes.find((node) => node.id === member.endNodeId);
  return start && end ? { start, end } : null;
};

const addMember = (member: Member3D) => {
  const endpoints = memberEndpoints(member);
  if (!endpoints) return;
  const start = toThree(endpoints.start);
  const end = toThree(endpoints.end);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 1e-9) return;
  const selected = isSpatialAnalysisActive.value
    ? structuralStore.selectedMemberId === member.id
    : projectStore.selection2.elements.includes(member.id);
  const material = new THREE.MeshStandardMaterial({
    color: selected ? 0x0768d7 : getMemberResultColor(member.id),
    roughness: 0.42,
    metalness: 0.22,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, length, 12), material);
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.name = `member-${member.id}`;
  addEntity(mesh, 'element', member.id);

  if (viewerStore.showElementLabels) {
    const label = textSprite(member.id);
    label.position.copy(mesh.position).add(new THREE.Vector3(0, 0.15, 0));
    modelGroup?.add(label);
  }

  if (viewerStore.showLocalAxes && endpoints) addLocalAxes(member, endpoints.start, endpoints.end);
  if (viewerStore.threeDResultMode !== 'model') addResultDiagram(member);
};

const getMemberResultColor = (memberId: string) => {
  const mode = viewerStore.threeDResultMode;
  if (mode === 'model' || mode === 'displacement') return 0x1c2737;
  const value = structureModel.value.memberForces
    .filter((force) => force.memberId === memberId)
    .reduce((maximum, force) => Math.max(maximum, Math.abs(mode === 'normal' ? force.axialForce : mode === 'shear' ? force.shearY : force.bendingZ)), 0);
  const maximum = Math.max(
    ...structureModel.value.memberForces.map((force) => Math.abs(mode === 'normal' ? force.axialForce : mode === 'shear' ? force.shearY : force.bendingZ)),
    1
  );
  return new THREE.Color().setHSL((1 - value / maximum) * 0.58, 0.72, 0.43).getHex();
};

const addLocalAxes = (member: Member3D, start: Node3D, end: Node3D) => {
  const axes = createMemberLocalAxes3D(start, end, member.localAxisRotation ?? 0);
  const origin = toThree(start).lerp(toThree(end), 0.5);
  const axisLength = Math.max(toThree(end).distanceTo(toThree(start)) * 0.18, 0.35);
  const group = new THREE.Group();
  const colors = [0xe53935, 0x34a853, 0x1a73e8];
  [axes.x, axes.y, axes.z].forEach((axis, index) => {
    group.add(new THREE.ArrowHelper(toThree(axis), origin, axisLength, colors[index], axisLength * 0.25, axisLength * 0.12));
  });
  modelGroup?.add(group);
};

const addResultDiagram = (member: Member3D) => {
  if (!structureModel.value.solved || viewerStore.threeDResultMode === 'displacement') return;
  const values = structureModel.value.memberForces.filter((force) => force.memberId === member.id);
  const endpoints = memberEndpoints(member);
  if (!endpoints || values.length === 0) return;
  const selectedValue = (force: (typeof values)[number]) =>
    viewerStore.threeDResultMode === 'normal'
      ? force.axialForce
      : viewerStore.threeDResultMode === 'shear'
        ? force.shearY
        : force.bendingZ;
  const maximum = Math.max(...structureModel.value.memberForces.map((force) => Math.abs(selectedValue(force))), 1);
  const axes = createMemberLocalAxes3D(endpoints.start, endpoints.end);
  const start = toThree(endpoints.start);
  const end = toThree(endpoints.end);
  const offsetDirection = toThree(axes.z);
  const points = values.map((force) => {
    const base = start.clone().lerp(end, force.position);
    return base.addScaledVector(offsetDirection, (selectedValue(force) / maximum) * 0.35);
  });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: viewerStore.threeDResultMode === 'moment' ? 0xd14343 : 0x107c41 })
  );
  modelGroup?.add(line);
};

const addNode = (node: Node3D) => {
  const selected = isSpatialAnalysisActive.value
    ? structuralStore.selectedNodeId === node.id
    : projectStore.selection2.nodes.includes(node.id);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(selected ? 0.09 : 0.07, 16, 12),
    new THREE.MeshStandardMaterial({ color: selected ? 0xffb300 : 0x0c4a85, roughness: 0.35, metalness: 0.15 })
  );
  mesh.position.copy(toThree(node));
  mesh.name = `node-${node.id}`;
  addEntity(mesh, 'node', node.id);

  if (viewerStore.showNodeLabels) {
    const label = textSprite(`N${node.id}`);
    label.position.copy(mesh.position).add(new THREE.Vector3(0.12, 0.12, 0));
    modelGroup?.add(label);
  }
};

const addSupport = (constraint: NodeConstraint3D) => {
  if (!viewerStore.showSupports) return;
  const node = structureModel.value.nodes.find((item) => item.id === constraint.nodeId);
  if (!node) return;
  const group = new THREE.Group();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.22, 4),
    new THREE.MeshStandardMaterial({ color: 0x566273, roughness: 0.65 })
  );
  cone.rotation.x = Math.PI;
  cone.position.set(node.x, node.y - 0.14, node.z);
  group.add(cone);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.26), new THREE.MeshStandardMaterial({ color: 0x7d8798 }));
  base.position.set(node.x, node.y - 0.27, node.z);
  group.add(base);
  const label = textSprite(constraint.constrainedDofs.join(','), '#435167');
  label.position.set(node.x, node.y - 0.48, node.z);
  group.add(label);
  addEntity(group, 'support', constraint.nodeId);
};

const addArrow = (origin: THREE.Vector3, direction: THREE.Vector3, length: number, color: number, id: string) => {
  if (direction.lengthSq() < 1e-12) return;
  const arrow = new THREE.ArrowHelper(direction.normalize(), origin, length, color, length * 0.28, length * 0.12);
  addEntity(arrow, 'load', id);
};

const addLoads = () => {
  if (!viewerStore.showLoads) return;
  const loads = structureModel.value.nodalLoads;
  const maximum = Math.max(...loads.map((load) => toThree(load.force).length()), 1);
  loads.forEach((load, index) => {
    const node = structureModel.value.nodes.find((item) => item.id === load.nodeId);
    if (!node) return;
    const vector = toThree(load.force);
    const magnitude = vector.length();
    const direction = vector.lengthSq() > 0 ? vector.normalize() : new THREE.Vector3();
    const length = 0.5 + (magnitude / maximum) * 0.8;
    addArrow(toThree(node).addScaledVector(direction, -length), direction, length, 0xe77b00, `nodal-${index}`);
    if (viewerStore.showMoments && toThree(load.moment).lengthSq() > 1e-12) {
      const momentAxis = toThree(load.moment).normalize();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.012, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xe77b00 })
      );
      ring.position.copy(toThree(node)).add(new THREE.Vector3(0, 0, 0.06));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), momentAxis);
      addEntity(ring, 'load', `moment-${index}`);
      const tangentReference = Math.abs(momentAxis.x) > 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangent = tangentReference.cross(momentAxis).normalize();
      addArrow(ring.position.clone().addScaledVector(tangent, -0.1), tangent, 0.12, 0xe77b00, `moment-${index}`);
    }
  });

  if (!viewerStore.showDistributedLoads) return;
  structureModel.value.distributedLoads.forEach((load) => {
    const member = structureModel.value.members.find((item) => item.id === load.memberId);
    if (!member) return;
    const resolved = memberEndpoints(member);
    if (!resolved) return;
    const start = toThree(resolved.start);
    const end = toThree(resolved.end);
    const maximumValue = Math.max(toThree(load.startForce).length(), toThree(load.endForce).length(), 1);
    for (let index = 0; index <= 5; index++) {
      const ratio = index / 5;
      const force = toThree(load.startForce).lerp(toThree(load.endForce), ratio);
      if (force.lengthSq() < 1e-12) continue;
      const magnitude = force.length();
      const direction = force.normalize();
      const length = 0.25 + (magnitude / maximumValue) * 0.38;
      addArrow(start.clone().lerp(end, ratio).addScaledVector(direction, -length), direction, length, 0x9d4edd, load.id);
    }
  });
};

const addDeformedShape = () => {
  if (!viewerStore.showDeformedShape || !viewerStore.showDeformedOverlay || !structureModel.value.solved) return;
  const displacementMap = new Map(structureModel.value.displacements.map((item) => [item.nodeId, item]));
  structureModel.value.members.forEach((member) => {
    const endpoints = memberEndpoints(member);
    if (!endpoints) return;
    const startDisplacement = displacementMap.get(member.startNodeId)?.translation ?? { x: 0, y: 0, z: 0 };
    const endDisplacement = displacementMap.get(member.endNodeId)?.translation ?? { x: 0, y: 0, z: 0 };
    const points = [
      toThree(endpoints.start).addScaledVector(toThree(startDisplacement), deformationScale.value),
      toThree(endpoints.end).addScaledVector(toThree(endDisplacement), deformationScale.value),
    ];
    modelGroup?.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x11a683 }))
    );
  });
};

const buildModel = () => {
  if (!scene || !renderer) return;
  clearModel();
  structureModel.value.members.forEach(addMember);
  structureModel.value.nodes.forEach(addNode);
  structureModel.value.constraints.forEach(addSupport);
  addLoads();
  addDeformedShape();
};

const updateCameraAspect = () => {
  if (!host.value || !renderer || !camera) return;
  const width = Math.max(host.value.clientWidth, 1);
  const height = Math.max(host.value.clientHeight, 1);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = width / height;
  } else {
    const viewHeight = 8;
    const viewWidth = viewHeight * (width / height);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};

const fitToStructure = () => {
  if (!camera || !controls || structureModel.value.nodes.length === 0) return;
  const box = new THREE.Box3().setFromPoints(structureModel.value.nodes.map(toThree));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const width = Math.max(host.value?.clientWidth ?? 1, 1);
  const height = Math.max(host.value?.clientHeight ?? 1, 1);
  const aspectAllowance = Math.sqrt(Math.max(1, height / width));
  const controlAllowance = width < 680 ? 1.08 : 1;
  const radius = Math.max(size.length() * 0.82, 2.5) * aspectAllowance * controlAllowance;
  controls.target.copy(center);
  cameraTarget.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(radius, radius * 0.75, radius));
  if (camera instanceof THREE.OrthographicCamera) camera.zoom = Math.max(0.1, 7 / radius);
  camera.updateProjectionMatrix();
  controls.update();
};

const resizeScene = () => {
  if (!host.value) return;
  const nextAspect = Math.max(host.value.clientWidth, 1) / Math.max(host.value.clientHeight, 1);
  const aspectChangedSignificantly =
    lastViewportAspect > 0 && Math.abs(Math.log(nextAspect / lastViewportAspect)) > 0.2;
  updateCameraAspect();
  lastViewportAspect = nextAspect;
  if (!aspectChangedSignificantly) return;
  if (resizeFitTimer) globalThis.clearTimeout(resizeFitTimer);
  resizeFitTimer = globalThis.setTimeout(() => {
    fitToStructure();
    resizeFitTimer = null;
  }, 80);
};

const setCameraPosition = (preset: ViewPreset) => {
  if (!camera || !controls) return;
  if (preset === 'reset') return fitToStructure();
  const box = new THREE.Box3().setFromPoints(structureModel.value.nodes.map(toThree));
  const center = structureModel.value.nodes.length ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3();
  const radius = Math.max(box.getSize(new THREE.Vector3()).length() * 0.9, 5);
  const positions: Record<Exclude<ViewPreset, 'reset'>, THREE.Vector3> = {
    front: new THREE.Vector3(0, 0, radius),
    back: new THREE.Vector3(0, 0, -radius),
    left: new THREE.Vector3(-radius, 0, 0),
    right: new THREE.Vector3(radius, 0, 0),
    top: new THREE.Vector3(0, radius, 0),
    bottom: new THREE.Vector3(0, -radius, 0),
    axonometric: new THREE.Vector3(radius, radius * 0.7, radius),
  };
  cameraTarget.copy(center);
  cameraAnimation = { from: camera.position.clone(), to: center.clone().add(positions[preset]), startedAt: performance.now(), duration: 260 };
  controls.target.copy(center);
};

const toggleProjection = () => {
  if (!host.value || !camera || !controls) return;
  const position = camera.position.clone();
  const target = controls.target.clone();
  const aspect = Math.max(host.value.clientWidth / Math.max(host.value.clientHeight, 1), 0.1);
  const next =
    projection.value === 'perspective'
      ? new THREE.OrthographicCamera(-4 * aspect, 4 * aspect, 4, -4, 0.01, 10000)
      : new THREE.PerspectiveCamera(42, aspect, 0.01, 10000);
  projection.value = projection.value === 'perspective' ? 'orthographic' : 'perspective';
  next.position.copy(position);
  next.lookAt(target);
  scene?.remove(camera);
  camera = next;
  scene?.add(camera);
  controls.dispose();
  controls = new OrbitControls(camera, renderer!.domElement);
  controls.enableDamping = true;
  controls.target.copy(target);
  controls.update();
  updateCameraAspect();
};

const eventPointer = (event: PointerEvent) => {
  if (!renderer) return;
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
};

const updateHover = (event: PointerEvent) => {
  if (!camera || !modelGroup || !renderer) return;
  eventPointer(event);
  raycaster.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(modelPlane, point)) cursorWorld.value = toData(point);
  const hit = raycaster.intersectObjects(modelGroup.children, true).find((entry) => entry.object.userData.entityType);
  if (hoverObject && hoverObject !== hit?.object) setObjectHover(hoverObject, false);
  hoverObject = hit?.object ?? null;
  if (hoverObject) setObjectHover(hoverObject, true);
  renderer.domElement.style.cursor = hoverObject ? 'pointer' : 'grab';
};

const setObjectHover = (object: THREE.Object3D, active: boolean) => {
  object.traverse((child) => {
    const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (material?.emissive) material.emissive.setHex(active ? 0x193f71 : 0x000000);
  });
};

const findEntityObject = (object: THREE.Object3D | null) => {
  let current = object;
  while (current && !current.userData.entityType) current = current.parent;
  return current;
};

const selectFromPointer = (event: PointerEvent) => {
  if (!camera || !modelGroup) return;
  eventPointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(modelGroup.children, true).find((entry) => findEntityObject(entry.object));
  const entity = findEntityObject(hit?.object ?? null);
  if (!entity) {
    if (isSpatialAnalysisActive.value) {
      structuralStore.selectedNodeId = null;
      structuralStore.selectedMemberId = null;
      return;
    }
    projectStore.clearSelection();
    projectStore.clearSelection2();
    return;
  }
  const type = entity.userData.entityType as string;
  const id = String(entity.userData.entityId);
  if (isSpatialAnalysisActive.value) {
    structuralStore.selectedNodeId = type === 'node' ? id : null;
    structuralStore.selectedMemberId = type === 'element' ? id : null;
    return;
  }
  projectStore.clearSelection();
  projectStore.clearSelection2();
  projectStore.selection.label = id;
  projectStore.selection.type = type === 'element' ? 'element' : type === 'node' ? 'node' : type;
  if (type === 'node') projectStore.selection2.nodes.push(id);
  if (type === 'element') projectStore.selection2.elements.push(id);
  if (type === 'load') projectStore.selection2.nodalLoads.push(Number(id.replace(/\D/g, '')) || 0);
};

const focusSelection = () => {
  if (!camera || !controls) return;
  const node = selectedNode.value;
  const member = selectedMember.value;
  const target = node
    ? toThree(node)
    : member
      ? (() => {
          const endpoints = memberEndpoints(member);
          return endpoints ? toThree(endpoints.start).lerp(toThree(endpoints.end), 0.5) : new THREE.Vector3();
        })()
      : null;
  if (!target) return fitToStructure();
  const offset = camera.position.clone().sub(controls.target).normalize().multiplyScalar(3);
  cameraTarget.copy(target);
  cameraAnimation = { from: camera.position.clone(), to: target.clone().add(offset), startedAt: performance.now(), duration: 220 };
  controls.target.copy(target);
};

const syncSelectedNode = () => {
  if (!selectedNode.value) return;
  selectedNodeCoordinates.value = { ...selectedNode.value };
};

const saveSelectedNode = () => {
  const node = selectedNode.value;
  if (!node) return;
  const next = selectedNodeCoordinates.value;
  if (![next.x, next.y, next.z].every(Number.isFinite)) return;
  if (isSpatialAnalysisActive.value) {
    structuralStore.updateNode(node.id, next);
    renderError.value = '';
    return;
  }
  if (Math.abs(next.z) > 1e-9) {
    renderError.value = '当前二维求解模型锁定在 Z=0 平面；请使用空间桁架或空间刚架求解器建立真实三维分析模型。';
    return;
  }
  executeModelMutationWithUndo(() => {
    const sourceNode = projectStore.solver.domain.nodes.get(node.id);
    if (!sourceNode) return;
    sourceNode.coords = [next.x, 0, next.y];
    projectStore.solver.domain.nodes = new Map(projectStore.solver.domain.nodes);
  });
};

const setScale = (value: string) => {
  manualDeformationScale.value = value === 'auto' ? null : Number(value);
};

const animate = (now: number) => {
  animationFrame = requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !controls) return;
  if (cameraAnimation) {
    const progress = Math.min(1, (now - cameraAnimation.startedAt) / cameraAnimation.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(cameraAnimation.from, cameraAnimation.to, eased);
    if (progress >= 1) cameraAnimation = null;
  }
  controls.update();
  if (gizmoAxes.value) {
    const rotation = new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion.clone().invert());
    gizmoAxes.value.style.transform = `matrix3d(${rotation.elements.join(',')})`;
  }
  renderer.render(scene, camera);
};

const createReferenceGrid = () => {
  if (!scene) return;
  const previous = scene.getObjectByName('global-grid');
  if (previous) {
    scene.remove(previous);
    disposeObject(previous);
  }
  const dark = uiStore.theme === 'dark';
  const grid = new THREE.GridHelper(20, 20, dark ? 0x56616e : 0x8996a5, dark ? 0x30363e : 0xcbd3dc);
  grid.rotation.x = Math.PI / 2;
  grid.visible = viewerStore.showGrid;
  grid.name = 'global-grid';
  scene.add(grid);
};

const applyViewportTheme = () => {
  if (!scene) return;
  scene.background = new THREE.Color(uiStore.theme === 'dark' ? 0x181b20 : 0xf3f5f7);
  createReferenceGrid();
};

const setupScene = () => {
  if (!host.value) return;
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(uiStore.theme === 'dark' ? 0x181b20 : 0xf3f5f7);
    camera = new THREE.PerspectiveCamera(42, 1, 0.01, 10000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.value.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x526375, 2.6));
    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(4, 8, 6);
    scene.add(light);
    createReferenceGrid();
    const axes = new THREE.AxesHelper(1.15);
    axes.name = 'global-axes';
    scene.add(axes);
    modelGroup = new THREE.Group();
    scene.add(modelGroup);
    renderer.domElement.addEventListener('pointermove', updateHover);
    renderer.domElement.addEventListener('pointerdown', selectFromPointer);
    renderer.domElement.addEventListener('dblclick', focusSelection);
    resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(host.value);
    resizeScene();
    buildModel();
    fitToStructure();
    animationFrame = requestAnimationFrame(animate);
  } catch (error) {
    renderError.value = `三维渲染初始化失败：${error instanceof Error ? error.message : '浏览器不支持 WebGL'}`;
  }
};

watch(
  () => [
    projectStore.solver.domain.nodes.size,
    projectStore.solver.domain.elements.size,
    projectStore.solver.loadCases[0]?.solved,
    projectStore.solver.loadCases[0]?.nodalLoadList.length,
    projectStore.solver.loadCases[0]?.elementLoadList.length,
    viewerStore.showLoads,
    viewerStore.showSupports,
    viewerStore.showNodeLabels,
    viewerStore.showElementLabels,
    viewerStore.showLocalAxes,
    viewerStore.showDeformedOverlay,
    viewerStore.showDistributedLoads,
    viewerStore.threeDResultMode,
    projectStore.selection2.nodes.join(','),
    projectStore.selection2.elements.join(','),
    structuralStore.model.revision,
    structuralStore.result?.modelRevision,
    structuralStore.selectedNodeId,
    structuralStore.selectedMemberId,
  ],
  () => nextTick(buildModel),
  { deep: true }
);
watch(() => uiStore.theme, () => {
  applyViewportTheme();
  nextTick(buildModel);
});
watch(selectedNode, syncSelectedNode, { immediate: true });
watch(
  () => viewerStore.showGrid,
  (visible) => {
    scene?.getObjectByName('global-grid') && (scene.getObjectByName('global-grid')!.visible = visible);
  }
);

const handleFitRequest = () => fitToStructure();

onMounted(() => {
  setupScene();
  eventBus.on(EventType.FIT_CONTENT, handleFitRequest);
});
onBeforeUnmount(() => {
  eventBus.off(EventType.FIT_CONTENT, handleFitRequest);
  cancelAnimationFrame(animationFrame);
  if (resizeFitTimer) globalThis.clearTimeout(resizeFitTimer);
  resizeObserver?.disconnect();
  controls?.dispose();
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', updateHover);
    renderer.domElement.removeEventListener('pointerdown', selectFromPointer);
    renderer.domElement.removeEventListener('dblclick', focusSelection);
    renderer.dispose();
    renderer.domElement.remove();
  }
  if (scene) disposeObject(scene);
});
</script>

<template>
  <div class="structure-3d-viewer">
    <div ref="host" class="structure-3d-canvas" aria-label="三维结构视图"></div>

    <div class="structure-3d-toolbar" aria-label="三维视图工具栏">
      <v-btn icon="mdi-cube-scan" size="small" variant="flat" title="适应窗口" @click="fitToStructure" />
      <v-btn icon="mdi-crosshairs-gps" size="small" variant="flat" title="聚焦选中对象" @click="focusSelection" />
      <v-btn icon="mdi-camera-switch" size="small" variant="flat" :title="projection === 'perspective' ? '切换为正交投影' : '切换为透视投影'" @click="toggleProjection" />
      <v-menu location="bottom">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon="mdi-layers-outline" size="small" variant="flat" title="图层" />
        </template>
        <v-list density="compact" class="structure-3d-menu">
          <v-list-item><v-checkbox v-model="viewerStore.showGrid" label="参考网格" density="compact" hide-details /></v-list-item>
          <v-list-item><v-checkbox v-model="viewerStore.showNodeLabels" label="节点编号" density="compact" hide-details /></v-list-item>
          <v-list-item><v-checkbox v-model="viewerStore.showElementLabels" label="构件编号" density="compact" hide-details /></v-list-item>
          <v-list-item><v-checkbox v-model="viewerStore.showLocalAxes" label="构件局部轴" density="compact" hide-details /></v-list-item>
          <v-list-item><v-checkbox v-model="viewerStore.showLoads" label="载荷" density="compact" hide-details /></v-list-item>
          <v-list-item><v-checkbox v-model="viewerStore.showDeformedOverlay" label="变形叠加" density="compact" hide-details /></v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="structure-3d-views" aria-label="标准视角">
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('front')">前</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('back')">后</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('left')">左</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('right')">右</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('top')">俯</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('bottom')">仰</v-btn>
      <v-btn size="x-small" variant="tonal" @click="setCameraPosition('axonometric')">轴测</v-btn>
    </div>

    <div class="structure-3d-orientation" aria-label="坐标方向指示器">
      <div ref="gizmoAxes" class="structure-3d-gizmo-axes">
        <span class="gizmo-line gizmo-line--x" />
        <span class="gizmo-line gizmo-line--y" />
        <span class="gizmo-line gizmo-line--z" />
        <button class="axis-x" title="沿 X 轴观察" @click="setCameraPosition('right')">X</button>
        <button class="axis-y" title="沿 Y 轴观察" @click="setCameraPosition('top')">Y</button>
        <button class="axis-z" title="沿 Z 轴观察" @click="setCameraPosition('front')">Z</button>
      </div>
    </div>

    <div class="structure-3d-result-panel">
      <v-select
        v-model="viewerStore.threeDResultMode"
        label="结果图层"
        density="compact"
        hide-details
        :items="resultLayerItems"
      />
      <v-select
        label="变形放大"
        density="compact"
        hide-details
        class="mt-2"
        :model-value="manualDeformationScale === null ? 'auto' : String(manualDeformationScale)"
        :items="[
          { title: `自动 (${autoDeformationScale.toFixed(1)}x)`, value: 'auto' },
          { title: '1x', value: '1' },
          { title: '10x', value: '10' },
          { title: '50x', value: '50' },
          { title: '100x', value: '100' },
        ]"
        @update:model-value="setScale"
      />
    </div>

    <v-card v-if="props.showProperties && selectedNode" class="structure-3d-properties" elevation="4">
      <v-card-title class="text-subtitle-2">节点 {{ selectedNode.id }} 坐标</v-card-title>
      <v-card-text class="pb-2">
        <v-text-field v-model.number="selectedNodeCoordinates.x" label="X" density="compact" type="number" hide-details class="mb-2" />
        <v-text-field v-model.number="selectedNodeCoordinates.y" label="Y" density="compact" type="number" hide-details class="mb-2" />
        <v-text-field
          v-model.number="selectedNodeCoordinates.z"
          :label="isSpatialAnalysisActive ? 'Z' : 'Z（二维平面锁定）'"
          density="compact"
          type="number"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-btn block color="primary" size="small" @click="saveSelectedNode">更新坐标</v-btn>
      </v-card-actions>
    </v-card>

    <div v-if="renderError" class="structure-3d-message">
      {{ renderError }}
    </div>
    <div class="structure-3d-status">
      <span v-if="cursorWorld">X {{ cursorWorld.x.toFixed(3) }} | Y {{ cursorWorld.y.toFixed(3) }} | Z {{ cursorWorld.z.toFixed(3) }}</span>
      <span v-else>全局右手坐标系 XYZ</span>
      <span>{{ projection === 'perspective' ? '透视投影' : '正交投影' }}</span>
      <span>{{ currentResultLabel }}</span>
      <span>变形 {{ deformationScale.toFixed(1) }}x</span>
    </div>
    <div v-if="structureModel.solved" class="structure-3d-disclaimer">
      {{
        isSpatialAnalysisActive
          ? '空间杆系有限元结果；当前不是实体单元连续应力云图。'
          : '二维杆系理论计算结果，仅在真实求解平面内展示，不是实体有限元云图。'
      }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.structure-3d-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  background: var(--bg-viewport);
}

.structure-3d-canvas,
.structure-3d-canvas :deep(canvas) {
  width: 100%;
  height: 100%;
  display: block;
}

.structure-3d-toolbar,
.structure-3d-views,
.structure-3d-result-panel,
.structure-3d-properties,
.structure-3d-status,
.structure-3d-disclaimer,
.structure-3d-message,
.structure-3d-orientation {
  position: absolute;
  z-index: 2;
}

.structure-3d-toolbar {
  top: 10px;
  left: 10px;
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-toolbar) 92%, transparent);
}

.structure-3d-views {
  top: 10px;
  right: 10px;
  display: grid;
  grid-template-columns: repeat(3, 34px);
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-toolbar) 92%, transparent);
}

.structure-3d-result-panel {
  top: 92px;
  right: 10px;
  width: 178px;
  padding: 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-panel) 94%, transparent);
}

.structure-3d-properties {
  right: 12px;
  bottom: 54px;
  width: 220px;
  border-radius: var(--radius-md);
}

.structure-3d-orientation {
  right: 14px;
  bottom: 42px;
  width: 76px;
  height: 76px;
  border: 1px solid var(--border-default);
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg-panel) 90%, transparent);
  font-size: 11px;
  perspective: 180px;
}

.structure-3d-gizmo-axes {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 40ms linear;
}

.structure-3d-orientation button {
  position: absolute;
  z-index: 2;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--bg-elevated);
  font-weight: 700;
  font-size: 10px;
  cursor: pointer;
}

.gizmo-line { position: absolute; left: 37px; top: 37px; width: 27px; height: 2px; transform-origin: left center; }
.gizmo-line--x { background: #ef6461; }
.gizmo-line--y { background: #55b981; transform: rotate(-90deg); }
.gizmo-line--z { background: #65a9e8; transform: rotate(135deg); }
.axis-x { right: 1px; top: 29px; color: #ef6461; }
.axis-y { left: 29px; top: 1px; color: #55b981; }
.axis-z { left: 4px; bottom: 4px; color: #65a9e8; }

.structure-3d-status {
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 12px;
  max-width: calc(100% - 110px);
  padding: 4px 7px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-toolbar) 90%, transparent);
  color: var(--text-secondary);
  font: 10px var(--font-mono);
}

.structure-3d-disclaimer {
  right: 12px;
  bottom: 32px;
  max-width: min(560px, calc(100% - 110px));
  color: var(--text-muted);
  font-size: 11px;
  text-align: right;
}

.structure-3d-message {
  top: 50%;
  left: 50%;
  max-width: 520px;
  padding: 12px 16px;
  background: rgba(255, 248, 232, 0.97);
  color: #7c2d12;
  transform: translate(-50%, -50%);
}

.structure-3d-menu { min-width: 170px; }

.structure-3d-toolbar :deep(.v-btn),
.structure-3d-views :deep(.v-btn) {
  min-width: 30px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 10px;
}

.structure-3d-toolbar :deep(.v-btn:hover),
.structure-3d-views :deep(.v-btn:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

@media (max-width: 760px) {
  .structure-3d-result-panel { display: none; }
  .structure-3d-properties { top: 120px; right: 8px; bottom: auto; width: 190px; }
  .structure-3d-views { display: none; }
  .structure-3d-status { gap: 8px; overflow: hidden; white-space: nowrap; font-size: 9px; }
  .structure-3d-disclaimer { display: none; }
}
</style>
