<script setup lang="ts">
import { computed, ref } from 'vue';
import { MouseMode } from '@/mouse';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useStructuralStore } from '@/store/structural';
import { useUiStore } from '@/store/ui';
import { useViewerStore } from '@/store/viewer';
import { useWorkspaceStore } from '@/store/workspace';

const appStore = useAppStore();
const projectStore = useProjectStore();
const structuralStore = useStructuralStore();
const uiStore = useUiStore();
const viewerStore = useViewerStore();
const workspaceStore = useWorkspaceStore();

const expanded = ref(new Set(['geometry', 'materials', 'sections', 'constraints', 'loads', 'results']));
const isPlanar = computed(() => workspaceStore.analysisDimension === '2d');
const planarNodes = computed(() => [...projectStore.solver.domain.nodes.values()]);
const planarElements = computed(() => [...projectStore.solver.domain.elements.values()]);
const planarMaterials = computed(() => [...projectStore.solver.domain.materials.values()]);
const planarSections = computed(() => [...projectStore.solver.domain.crossSections.values()]);
const planarLoadCase = computed(() => projectStore.solver.loadCases[0]);
const planarConstraints = computed(() => planarNodes.value.filter((node) => node.bcs.size > 0));
const spatialConstraints = computed(() => structuralStore.model.nodes.filter((node) => Object.values(node.constraints).some(Boolean)));
const materialRows = computed(() => isPlanar.value
  ? planarMaterials.value.map((material) => ({ key: String(material.label), title: `Material ${material.label}`, planar: true }))
  : structuralStore.model.materials.map((material) => ({ key: material.id, title: material.name, planar: false }))
);
const sectionRows = computed(() => isPlanar.value
  ? planarSections.value.map((section) => ({ key: String(section.label), title: `Section ${section.label}`, planar: true }))
  : structuralStore.model.sections.map((section) => ({ key: section.id, title: section.name, planar: false }))
);
const isSolved = computed(() => isPlanar.value ? Boolean(planarLoadCase.value?.solved) : structuralStore.resultIsCurrent);

const matches = (value: unknown) => String(value).toLowerCase().includes(uiStore.modelTreeFilter.trim().toLowerCase());
const toggle = (key: string) => {
  const next = new Set(expanded.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expanded.value = next;
};

const selectPlanar = (kind: 'node' | 'element' | 'nodalLoad' | 'elementLoad' | 'prescribed', id: string | number) => {
  projectStore.clearSelection();
  projectStore.clearSelection2();
  appStore.mouseMode = MouseMode.NONE;
  if (kind === 'node') projectStore.selection2.nodes.push(String(id));
  if (kind === 'element') projectStore.selection2.elements.push(String(id));
  if (kind === 'nodalLoad') projectStore.selection2.nodalLoads.push(Number(id));
  if (kind === 'elementLoad') projectStore.selection2.elementLoads.push(Number(id));
  if (kind === 'prescribed') projectStore.selection2.prescribedBC.push(Number(id));
};

const selectSpatialNode = (id: string) => {
  structuralStore.selectedNodeId = id;
  structuralStore.selectedMemberId = null;
};

const selectSpatialMember = (id: string) => {
  structuralStore.selectedMemberId = id;
  structuralStore.selectedNodeId = null;
};

const openData = (tab: string) => {
  appStore.bottomBarTab = `tab-${tab}`;
  appStore.bottomBarOpen = true;
};

const showResult = (result: 'model' | 'displacement' | 'normal' | 'shear' | 'moment') => {
  if (isPlanar.value) {
    viewerStore.showDeformedShape = result === 'displacement';
    viewerStore.showNormalForce = result === 'normal';
    viewerStore.showShearForce = result === 'shear';
    viewerStore.showBendingMoment = result === 'moment';
  } else {
    viewerStore.threeDResultMode = result;
  }
};
</script>

<template>
  <section class="model-tree" aria-label="模型树">
    <header class="cae-panel-header">
      <span><v-icon size="15" class="mr-1">mdi-file-tree-outline</v-icon>模型树</span>
      <button class="panel-action" title="折叠模型树" @click="uiStore.leftSidebarCollapsed = true"><v-icon size="16">mdi-chevron-double-left</v-icon></button>
    </header>
    <div class="model-tree__search">
      <v-icon size="15">mdi-magnify</v-icon>
      <input v-model="uiStore.modelTreeFilter" type="search" placeholder="筛选模型对象" aria-label="筛选模型对象" />
      <button v-if="uiStore.modelTreeFilter" title="清除筛选" @click="uiStore.modelTreeFilter = ''"><v-icon size="14">mdi-close</v-icon></button>
    </div>

    <div class="model-tree__scroll">
      <div class="tree-root">
        <v-icon size="16" color="primary">mdi-cube-outline</v-icon>
        <strong>{{ isPlanar ? '二维平面刚架' : structuralStore.capabilities.label }}</strong>
        <span>rev {{ isPlanar ? '2D' : structuralStore.model.revision }}</span>
      </div>

      <section class="tree-group">
        <button class="tree-group__header" @click="toggle('geometry')">
          <v-icon size="14">{{ expanded.has('geometry') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          <v-icon size="15">mdi-vector-polyline</v-icon><span>几何</span>
          <b>{{ isPlanar ? planarNodes.length + planarElements.length : structuralStore.model.nodes.length + structuralStore.model.members.length }}</b>
        </button>
        <div v-if="expanded.has('geometry')" class="tree-group__body">
          <div class="tree-subhead"><v-icon size="14">mdi-vector-point</v-icon><span>节点</span><b>{{ isPlanar ? planarNodes.length : structuralStore.model.nodes.length }}</b></div>
          <template v-if="isPlanar">
            <button v-for="node in planarNodes.filter((item) => matches(item.label))" :key="node.label" class="tree-row" :class="{ selected: projectStore.selection2.nodes.includes(String(node.label)) }" @click="selectPlanar('node', node.label)" @contextmenu.prevent="selectPlanar('node', node.label)"><span class="tree-indent" /><v-icon size="13" class="semantic-node">mdi-circle-medium</v-icon><span>Node {{ node.label }}</span><small class="cae-number">{{ node.coords[0].toFixed(3) }}, {{ node.coords[2].toFixed(3) }}</small></button>
          </template>
          <template v-else>
            <button v-for="node in structuralStore.model.nodes.filter((item) => matches(item.id))" :key="node.id" class="tree-row" :class="{ selected: structuralStore.selectedNodeId === node.id }" @click="selectSpatialNode(node.id)" @contextmenu.prevent="selectSpatialNode(node.id)"><span class="tree-indent" /><v-icon size="13" class="semantic-node">mdi-circle-medium</v-icon><span>Node {{ node.id }}</span><small class="cae-number">{{ node.x }}, {{ node.y }}, {{ node.z }}</small></button>
          </template>

          <div class="tree-subhead"><v-icon size="14">mdi-vector-line</v-icon><span>{{ isPlanar ? '梁单元' : '空间构件' }}</span><b>{{ isPlanar ? planarElements.length : structuralStore.model.members.length }}</b></div>
          <template v-if="isPlanar">
            <button v-for="element in planarElements.filter((item) => matches(item.label))" :key="element.label" class="tree-row" :class="{ selected: projectStore.selection2.elements.includes(String(element.label)) }" @click="selectPlanar('element', element.label)" @contextmenu.prevent="selectPlanar('element', element.label)"><span class="tree-indent" /><v-icon size="14">mdi-minus</v-icon><span>Beam {{ element.label }}</span><small class="cae-number">{{ element.nodes.join(' - ') }}</small></button>
          </template>
          <template v-else>
            <button v-for="member in structuralStore.model.members.filter((item) => matches(item.id))" :key="member.id" class="tree-row" :class="{ selected: structuralStore.selectedMemberId === member.id }" @click="selectSpatialMember(member.id)" @contextmenu.prevent="selectSpatialMember(member.id)"><span class="tree-indent" /><v-icon size="14">mdi-minus</v-icon><span>{{ member.id }}</span><small>{{ member.startNodeId }} - {{ member.endNodeId }}</small></button>
          </template>
        </div>
      </section>

      <section class="tree-group">
        <button class="tree-group__header" @click="toggle('materials')"><v-icon size="14">{{ expanded.has('materials') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon><v-icon size="15">mdi-texture-box</v-icon><span>材料</span><b>{{ isPlanar ? planarMaterials.length : structuralStore.model.materials.length }}</b></button>
        <div v-if="expanded.has('materials')" class="tree-group__body">
          <button v-for="material in materialRows.filter((item) => matches(item.title))" :key="material.key" class="tree-row" @click="material.planar ? openData('mats') : undefined"><span class="tree-indent" /><v-icon size="13">mdi-square-medium</v-icon><span>{{ material.title }}</span></button>
          <p v-if="materialRows.length === 0" class="tree-empty">尚未定义材料</p>
        </div>
      </section>

      <section class="tree-group">
        <button class="tree-group__header" @click="toggle('sections')"><v-icon size="14">{{ expanded.has('sections') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon><v-icon size="15">mdi-shape-outline</v-icon><span>截面</span><b>{{ isPlanar ? planarSections.length : structuralStore.model.sections.length }}</b></button>
        <div v-if="expanded.has('sections')" class="tree-group__body">
          <button v-for="section in sectionRows.filter((item) => matches(item.title))" :key="section.key" class="tree-row" @click="section.planar ? openData('cs') : undefined"><span class="tree-indent" /><v-icon size="13">mdi-square-outline</v-icon><span>{{ section.title }}</span></button>
          <p v-if="sectionRows.length === 0" class="tree-empty">尚未定义截面</p>
        </div>
      </section>

      <section class="tree-group">
        <button class="tree-group__header" @click="toggle('constraints')"><v-icon size="14">{{ expanded.has('constraints') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon><v-icon size="15" class="semantic-constraint">mdi-pin-outline</v-icon><span>约束</span><b>{{ isPlanar ? planarConstraints.length + planarLoadCase.prescribedBC.length : spatialConstraints.length }}</b></button>
        <div v-if="expanded.has('constraints')" class="tree-group__body">
          <template v-if="isPlanar"><button v-for="node in planarConstraints" :key="node.label" class="tree-row" @click="selectPlanar('node', node.label)"><span class="tree-indent" /><v-icon size="13" class="semantic-constraint">mdi-ray-start</v-icon><span>Support · Node {{ node.label }}</span><small>{{ node.bcs.size }} DOF</small></button><button v-for="(bc, index) in planarLoadCase.prescribedBC" :key="index" class="tree-row" @click="selectPlanar('prescribed', index)"><span class="tree-indent" /><v-icon size="13" class="semantic-constraint">mdi-ray-start-arrow</v-icon><span>Displacement {{ index + 1 }}</span><small>Node {{ bc.target }}</small></button></template>
          <template v-else><button v-for="node in spatialConstraints" :key="node.id" class="tree-row" @click="selectSpatialNode(node.id)"><span class="tree-indent" /><v-icon size="13" class="semantic-constraint">mdi-ray-start</v-icon><span>Support · {{ node.id }}</span></button></template>
        </div>
      </section>

      <section class="tree-group">
        <button class="tree-group__header" @click="toggle('loads')"><v-icon size="14">{{ expanded.has('loads') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon><v-icon size="15" class="semantic-load">mdi-arrow-down-bold-outline</v-icon><span>载荷</span><b>{{ isPlanar ? planarLoadCase.nodalLoadList.length + planarLoadCase.elementLoadList.length : structuralStore.model.nodalLoads.length }}</b></button>
        <div v-if="expanded.has('loads')" class="tree-group__body">
          <template v-if="isPlanar"><button v-for="(load, index) in planarLoadCase.nodalLoadList" :key="`n-${index}`" class="tree-row" :class="{ selected: projectStore.selection2.nodalLoads.includes(index) }" @click="selectPlanar('nodalLoad', index)"><span class="tree-indent" /><v-icon size="13" class="semantic-load">mdi-arrow-down</v-icon><span>Force {{ index + 1 }}</span><small>Node {{ load.target }}</small></button><button v-for="(load, index) in planarLoadCase.elementLoadList" :key="`e-${index}`" class="tree-row" :class="{ selected: projectStore.selection2.elementLoads.includes(index) }" @click="selectPlanar('elementLoad', index)"><span class="tree-indent" /><v-icon size="13" class="semantic-load">mdi-distribute-horizontal-center</v-icon><span>Element Load {{ index + 1 }}</span><small>{{ load.target }}</small></button></template>
          <template v-else><button v-for="load in structuralStore.model.nodalLoads" :key="load.id" class="tree-row"><span class="tree-indent" /><v-icon size="13" class="semantic-load">mdi-arrow-down</v-icon><span>{{ load.id }}</span><small>Node {{ load.nodeId }}</small></button></template>
          <p v-if="(isPlanar ? planarLoadCase.nodalLoadList.length + planarLoadCase.elementLoadList.length : structuralStore.model.nodalLoads.length) === 0" class="tree-empty">尚未施加载荷</p>
        </div>
      </section>

      <section class="tree-group tree-group--results">
        <button class="tree-group__header" :disabled="!isSolved" @click="toggle('results')"><v-icon size="14">{{ expanded.has('results') ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon><v-icon size="15" class="semantic-result">mdi-chart-bell-curve</v-icon><span>求解结果</span><b>{{ isSolved ? 'OK' : '—' }}</b></button>
        <div v-if="expanded.has('results') && isSolved" class="tree-group__body">
          <button class="tree-row" @click="showResult('displacement')"><span class="tree-indent" /><v-icon size="13">mdi-vector-curve</v-icon><span>位移 / 变形</span></button>
          <button class="tree-row" @click="showResult('normal')"><span class="tree-indent" /><v-icon size="13">mdi-arrow-expand-horizontal</v-icon><span>轴力 N</span></button>
          <button class="tree-row" @click="showResult('shear')"><span class="tree-indent" /><v-icon size="13">mdi-swap-vertical</v-icon><span>剪力 V</span></button>
          <button class="tree-row" @click="showResult('moment')"><span class="tree-indent" /><v-icon size="13">mdi-chart-bell-curve-cumulative</v-icon><span>弯矩 M</span></button>
          <button class="tree-row disabled" disabled><span class="tree-indent" /><v-icon size="13">mdi-gradient-horizontal</v-icon><span>Von Mises 应力</span><small>预留</small></button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.model-tree { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; background: var(--bg-panel); color: var(--text-primary); font-size: 12px; }
.panel-action { width: 24px; height: 24px; border: 0; background: transparent; color: var(--text-muted); cursor: pointer; }
.panel-action:hover { background: var(--bg-hover); color: var(--text-primary); }
.model-tree__search { display: flex; align-items: center; gap: 5px; height: 32px; margin: 6px; padding: 0 7px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-muted); }
.model-tree__search input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--text-primary); font-size: 11px; }
.model-tree__search button { border: 0; background: transparent; color: var(--text-muted); cursor: pointer; }
.model-tree__scroll { min-height: 0; overflow: auto; padding-bottom: 10px; }
.tree-root { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; min-height: 30px; padding: 0 8px; border-bottom: 1px solid var(--border-default); }
.tree-root span { color: var(--text-muted); font: 9px var(--font-mono); }
.tree-group { border-bottom: 1px solid rgba(127, 137, 149, 0.12); }
.tree-group__header, .tree-row { display: grid; align-items: center; width: 100%; border: 0; background: transparent; color: var(--text-secondary); text-align: left; cursor: pointer; }
.tree-group__header { grid-template-columns: 16px 19px minmax(0, 1fr) auto; min-height: 28px; padding: 0 8px 0 4px; font-size: 11px; font-weight: 650; }
.tree-group__header:hover, .tree-row:hover { background: var(--bg-hover); color: var(--text-primary); }
.tree-group__header:disabled { opacity: 0.5; cursor: default; }
.tree-group__header b, .tree-subhead b { min-width: 20px; color: var(--text-muted); font: 10px var(--font-mono); text-align: right; }
.tree-subhead { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; min-height: 24px; padding: 0 8px 0 22px; color: var(--text-muted); font-size: 10px; text-transform: uppercase; }
.tree-row { grid-template-columns: 17px 16px minmax(72px, 1fr) auto; min-height: 25px; padding: 0 8px 0 13px; font-size: 11px; }
.tree-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree-row small { max-width: 92px; overflow: hidden; color: var(--text-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.tree-row.selected { background: var(--bg-selected); color: var(--accent-strong); box-shadow: inset 2px 0 0 var(--accent); }
.tree-row.disabled { opacity: 0.46; }
.tree-empty { margin: 2px 8px 6px 39px; color: var(--text-muted); font-size: 10px; }
.semantic-node { color: var(--semantic-node); }
.semantic-load { color: var(--semantic-load); }
.semantic-constraint { color: var(--semantic-constraint); }
.semantic-result { color: var(--semantic-result); }
</style>
