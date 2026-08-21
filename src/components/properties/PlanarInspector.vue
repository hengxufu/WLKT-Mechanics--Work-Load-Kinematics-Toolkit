<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { openModal } from 'jenesius-vue-modal';
import { Beam2D, DofID } from 'ts-fem';
import AddCrossSection from '@/components/dialogs/AddCrossSection.vue';
import AddMaterial from '@/components/dialogs/AddMaterial.vue';
import AddNodalLoad from '@/components/dialogs/AddNodalLoad.vue';
import EditNode from '@/components/dialogs/EditNode.vue';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useUiStore } from '@/store/ui';
import { useViewerStore } from '@/store/viewer';
import { executeModelMutationWithUndo } from '@/utils';

const appStore = useAppStore();
const projectStore = useProjectStore();
const uiStore = useUiStore();
const viewerStore = useViewerStore();

const nodeForm = reactive({ x: 0, z: 0, dx: false, dz: false, ry: false });
const selectedNode = computed(() => {
  const id = projectStore.selection2.nodes[0];
  return projectStore.selection2.nodes.length === 1 ? projectStore.solver.domain.nodes.get(id) : undefined;
});
const selectedElement = computed(() => {
  const id = projectStore.selection2.elements[0];
  return projectStore.selection2.elements.length === 1
    ? projectStore.solver.domain.elements.get(id) as Beam2D | undefined
    : undefined;
});
const selectedNodalLoad = computed(() => projectStore.solver.loadCases[0].nodalLoadList[projectStore.selection2.nodalLoads[0]]);
const selectedElementLoad = computed(() => projectStore.solver.loadCases[0].elementLoadList[projectStore.selection2.elementLoads[0]]);
const selectedPrescribed = computed(() => projectStore.solver.loadCases[0].prescribedBC[projectStore.selection2.prescribedBC[0]]);
const selectedLoadOrBoundary = computed(() => selectedNodalLoad.value || selectedElementLoad.value || selectedPrescribed.value);
const selectedLoadTarget = computed(() => (selectedLoadOrBoundary.value as { target?: string | number } | undefined)?.target ?? '—');
const selectedLoadValues = computed(() => {
  const definition = selectedLoadOrBoundary.value as { values?: unknown; prescribedValues?: unknown } | undefined;
  return definition?.values ?? definition?.prescribedValues;
});
const selectionCount = computed(() =>
  projectStore.selection2.nodes.length + projectStore.selection2.elements.length + projectStore.selection2.nodalLoads.length +
  projectStore.selection2.elementLoads.length + projectStore.selection2.prescribedBC.length + projectStore.selection2.dimensions.length
);
const loadCount = computed(() => projectStore.solver.loadCases[0].nodalLoadList.length + projectStore.solver.loadCases[0].elementLoadList.length);
const solved = computed(() => Boolean(projectStore.solver.loadCases[0]?.solved));

watch(selectedNode, (node) => {
  if (!node) return;
  nodeForm.x = appStore.convertLength(node.coords[0]);
  nodeForm.z = appStore.convertLength(node.coords[2]);
  nodeForm.dx = node.bcs.has(DofID.Dx);
  nodeForm.dz = node.bcs.has(DofID.Dz);
  nodeForm.ry = node.bcs.has(DofID.Ry);
}, { immediate: true });

const applyNode = () => {
  const node = selectedNode.value;
  if (!node || !Number.isFinite(Number(nodeForm.x)) || !Number.isFinite(Number(nodeForm.z))) return;
  executeModelMutationWithUndo(() => {
    node.coords = [appStore.convertInverseLength(Number(nodeForm.x)), 0, appStore.convertInverseLength(Number(nodeForm.z))];
    node.bcs = new Set([
      ...(nodeForm.dx ? [DofID.Dx] : []),
      ...(nodeForm.dz ? [DofID.Dz] : []),
      ...(nodeForm.ry ? [DofID.Ry] : []),
    ]);
    projectStore.solver.domain.nodes = new Map(projectStore.solver.domain.nodes);
    projectStore.solver.loadCases[0].solved = false;
  });
  projectStore.solve();
};

const openData = (tab: string) => {
  appStore.bottomBarTab = `tab-${tab}`;
  appStore.bottomBarOpen = true;
};

const valueList = (value: unknown) => {
  if (!value || typeof value !== 'object') return String(value ?? '—');
  return Object.values(value as Record<string, unknown>).filter((item) => typeof item === 'number').map((item) => Number(item).toPrecision(4)).join(', ') || '—';
};
</script>

<template>
  <section id="viewerSettings" class="planar-inspector" aria-label="属性面板">
    <header class="cae-panel-header">
      <span><v-icon size="15" class="mr-1">mdi-tune-variant</v-icon>属性 / 参数</span>
      <button class="panel-action" title="折叠属性面板" @click="uiStore.rightSidebarCollapsed = true"><v-icon size="16">mdi-chevron-double-right</v-icon></button>
    </header>
    <div class="planar-inspector__scroll">
      <template v-if="selectedNode">
        <div class="inspector-title"><div><small>NODE</small><strong>节点 {{ selectedNode.label }}</strong></div><v-icon size="20" class="semantic-node">mdi-vector-point</v-icon></div>
        <section class="property-section">
          <h3>位置</h3>
          <label class="property-row"><span>X</span><input v-model.number="nodeForm.x" class="cae-number" type="number" /><em>{{ appStore.units.Length }}</em></label>
          <label class="property-row"><span>Y</span><input class="cae-number" type="number" value="0" disabled /><em>{{ appStore.units.Length }}</em></label>
          <label class="property-row"><span>Z</span><input v-model.number="nodeForm.z" class="cae-number" type="number" /><em>{{ appStore.units.Length }}</em></label>
        </section>
        <section class="property-section">
          <h3>边界条件</h3>
          <div class="dof-grid"><label><input v-model="nodeForm.dx" type="checkbox" /><span>Ux</span></label><label><input v-model="nodeForm.dz" type="checkbox" /><span>Uz</span></label><label><input v-model="nodeForm.ry" type="checkbox" /><span>Ry</span></label></div>
        </section>
        <div class="inspector-actions"><button class="secondary" @click="openModal(EditNode, { label: selectedNode.label })">高级编辑</button><button class="primary" @click="applyNode">应用</button></div>
      </template>

      <template v-else-if="selectedElement">
        <div class="inspector-title"><div><small>BEAM2D</small><strong>单元 {{ selectedElement.label }}</strong></div><v-icon size="20">mdi-vector-line</v-icon></div>
        <section class="property-section"><h3>连接</h3><div class="read-row"><span>起点</span><b>Node {{ selectedElement.nodes[0] }}</b></div><div class="read-row"><span>终点</span><b>Node {{ selectedElement.nodes[1] }}</b></div></section>
        <section class="property-section"><h3>定义</h3><div class="read-row"><span>材料</span><b>Material {{ selectedElement.mat }}</b></div><div class="read-row"><span>截面</span><b>Section {{ selectedElement.cs }}</b></div><div class="read-row"><span>类型</span><b>Euler / Timoshenko Beam</b></div></section>
        <div class="inspector-actions"><button class="primary" @click="openData('elements')">在数据表中编辑</button></div>
      </template>

      <template v-else-if="selectedNodalLoad || selectedElementLoad || selectedPrescribed">
        <div class="inspector-title"><div><small>LOAD / BC</small><strong>{{ selectedNodalLoad ? '节点荷载' : selectedElementLoad ? '单元荷载' : '位移边界条件' }}</strong></div><v-icon size="20" class="semantic-load">mdi-arrow-down-bold-outline</v-icon></div>
        <section class="property-section"><h3>定义</h3><div class="read-row"><span>类型</span><b>{{ selectedLoadOrBoundary?.constructor?.name }}</b></div><div class="read-row"><span>目标</span><b>{{ selectedLoadTarget }}</b></div><div class="read-row"><span>分量</span><b class="cae-number">{{ valueList(selectedLoadValues) }}</b></div></section>
        <div class="inspector-actions"><button class="primary" @click="openData('loads')">打开载荷表</button></div>
      </template>

      <template v-else-if="selectionCount > 1">
        <div class="inspector-empty"><v-icon size="28">mdi-selection-multiple</v-icon><strong>已选择 {{ selectionCount }} 个对象</strong><span>批量编辑可在底部数据面板中完成。</span><button @click="openData('nodes')">打开数据面板</button></div>
      </template>

      <template v-else>
        <div class="inspector-title"><div><small>MODEL</small><strong>二维平面刚架</strong></div><v-icon size="20" color="primary">mdi-axis-arrow</v-icon></div>
        <section class="property-section"><h3>模型摘要</h3><div class="read-row"><span>节点</span><b class="cae-number">{{ projectStore.solver.domain.nodes.size }}</b></div><div class="read-row"><span>单元</span><b class="cae-number">{{ projectStore.solver.domain.elements.size }}</b></div><div class="read-row"><span>载荷</span><b class="cae-number">{{ loadCount }}</b></div><div class="read-row"><span>方程数</span><b class="cae-number">{{ projectStore.solver.neq || '—' }}</b></div></section>
        <section class="property-section"><h3>显示</h3><label class="toggle-row"><span>支座</span><input v-model="viewerStore.showSupports" type="checkbox" /></label><label class="toggle-row"><span>荷载</span><input v-model="viewerStore.showLoads" type="checkbox" /></label><label class="toggle-row"><span>节点编号</span><input v-model="viewerStore.showNodeLabels" type="checkbox" /></label><label class="toggle-row"><span>单元编号</span><input v-model="viewerStore.showElementLabels" type="checkbox" /></label></section>
        <section v-if="solved" class="property-section"><h3>后处理</h3><label class="toggle-row"><span>变形</span><input v-model="viewerStore.showDeformedShape" type="checkbox" /></label><label class="toggle-row"><span>轴力 N</span><input v-model="viewerStore.showNormalForce" type="checkbox" /></label><label class="toggle-row"><span>剪力 V</span><input v-model="viewerStore.showShearForce" type="checkbox" /></label><label class="toggle-row"><span>弯矩 M</span><input v-model="viewerStore.showBendingMoment" type="checkbox" /></label></section>
        <section class="property-section"><h3>快速定义</h3><div class="quick-actions"><button @click="openModal(AddMaterial)"><v-icon size="15">mdi-texture-box</v-icon>材料</button><button @click="openModal(AddCrossSection)"><v-icon size="15">mdi-shape-outline</v-icon>截面</button><button :disabled="projectStore.solver.domain.nodes.size === 0" @click="openModal(AddNodalLoad)"><v-icon size="15">mdi-arrow-down-bold-outline</v-icon>荷载</button></div></section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.planar-inspector { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; background: var(--bg-panel); color: var(--text-primary); }
.panel-action { width: 24px; height: 24px; border: 0; background: transparent; color: var(--text-muted); cursor: pointer; }
.panel-action:hover { background: var(--bg-hover); color: var(--text-primary); }
.planar-inspector__scroll { min-height: 0; overflow: auto; }
.inspector-title { display: flex; align-items: center; justify-content: space-between; min-height: 54px; padding: 8px 12px; border-bottom: 1px solid var(--border-default); }
.inspector-title div { display: flex; flex-direction: column; }
.inspector-title small { color: var(--text-muted); font: 9px var(--font-mono); }
.inspector-title strong { font-size: 13px; }
.property-section { border-bottom: 1px solid var(--border-default); padding: 8px 10px 10px; }
.property-section h3 { margin: 0 0 7px; color: var(--text-secondary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.property-row { display: grid; grid-template-columns: 28px minmax(0, 1fr) 42px; align-items: center; gap: 6px; min-height: 32px; }
.property-row > span { color: var(--text-secondary); font-family: var(--font-mono); }
.property-row input { width: 100%; height: 28px; padding: 0 7px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); outline: 0; background: var(--bg-input); color: var(--text-primary); font-size: 11px; }
.property-row input:focus { border-color: var(--accent); }
.property-row input:disabled { opacity: 0.5; }
.property-row em { color: var(--text-muted); font: normal 9px var(--font-mono); }
.dof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.dof-grid label { display: flex; align-items: center; justify-content: center; gap: 5px; height: 28px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-secondary); font: 10px var(--font-mono); }
.dof-grid label:has(input:checked) { border-color: var(--semantic-constraint); background: rgba(86, 181, 138, 0.12); color: var(--semantic-constraint); }
.read-row, .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 27px; }
.read-row span, .toggle-row span { color: var(--text-muted); font-size: 11px; }
.read-row b { max-width: 68%; overflow: hidden; color: var(--text-secondary); font-size: 11px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.toggle-row input { accent-color: var(--accent); }
.inspector-actions { display: flex; justify-content: flex-end; gap: 6px; padding: 10px; }
.inspector-actions button, .inspector-empty button, .quick-actions button { min-height: 28px; padding: 0 9px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-toolbar); color: var(--text-secondary); font-size: 11px; cursor: pointer; }
.inspector-actions button.primary { border-color: var(--accent); background: var(--bg-selected); color: var(--accent-strong); }
.inspector-actions button:hover, .quick-actions button:hover { background: var(--bg-hover); color: var(--text-primary); }
.inspector-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 18px; color: var(--text-muted); text-align: center; }
.inspector-empty strong { color: var(--text-primary); font-size: 13px; }
.inspector-empty span { font-size: 11px; line-height: 1.5; }
.quick-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.quick-actions button { display: flex; align-items: center; justify-content: center; gap: 3px; padding: 0 4px; }
.quick-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
.semantic-node { color: var(--semantic-node); }
.semantic-load { color: var(--semantic-load); }
</style>
