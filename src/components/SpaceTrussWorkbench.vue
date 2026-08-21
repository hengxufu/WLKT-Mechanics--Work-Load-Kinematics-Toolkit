<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import ComputeBackendPanel from './ComputeBackendPanel.vue';
import StructuralViewportHost from './StructuralViewportHost.vue';
import { useSolverStore } from '@/store/solver';
import { useStructuralStore } from '@/store/structural';
import { useUiStore } from '@/store/ui';
import { emptyConstraints } from '@/utils/structuralModel';
import type { AnalysisModelType, StructuralDof } from '@/types/structuralAnalysis';

const props = withDefaults(defineProps<{ id: string; inspectorOnly?: boolean }>(), {
  inspectorOnly: false,
});

const structuralStore = useStructuralStore();
const solverStore = useSolverStore();
const uiStore = useUiStore();
const activePanel = ref<string[]>(['model', 'nodes', 'members', 'loads']);
const uiError = ref('');

const materialForm = reactive({
  id: 'steel',
  name: '钢材',
  elasticModulus: 210e9,
  shearModulus: 81e9,
  yieldStrength: 235e6,
});
const sectionForm = reactive({
  id: 'bar',
  name: '杆件截面',
  area: 0.01,
  iy: 8.33e-6,
  iz: 8.33e-6,
  torsionConstant: 1.67e-5,
});
const nodeForm = reactive({
  id: '',
  x: 0,
  y: 0,
  z: 0,
  ux: false,
  uy: false,
  uz: false,
  rx: false,
  ry: false,
  rz: false,
});
const memberForm = reactive({
  id: '',
  startNodeId: '',
  endNodeId: '',
  materialId: '',
  sectionId: '',
});
const loadForm = reactive({
  id: '',
  nodeId: '',
  fx: 0,
  fy: 0,
  fz: 0,
  mx: 0,
  my: 0,
  mz: 0,
});

const analysisTypes = [
  {
    title: '空间桁架',
    value: 'space-truss',
    subtitle: '可用：3 平移自由度、轴向杆单元',
  },
  {
    title: '空间刚架',
    value: 'space-frame',
    subtitle: '可用：6 自由度梁柱单元、轴力、弯曲与扭转',
  },
  {
    title: '三维实体',
    value: 'solid',
    subtitle: '实验内核：网格、恢复与云图尚未开放',
    props: { disabled: true },
  },
  {
    title: '平面刚架',
    value: 'planar-frame',
    subtitle: '请使用“二维建模”页',
    props: { disabled: true },
  },
];

const nodeOptions = computed(() =>
  structuralStore.model.nodes.map((node) => ({ title: node.id, value: node.id }))
);
const materialOptions = computed(() =>
  structuralStore.model.materials.map((material) => ({ title: material.name, value: material.id }))
);
const sectionOptions = computed(() =>
  structuralStore.model.sections.map((section) => ({ title: section.name, value: section.id }))
);
const result = computed(() => structuralStore.resultIsCurrent ? structuralStore.result : null);
const validationMessages = computed(() => [
  ...structuralStore.validation.errors.map((item) => ({ type: 'error' as const, text: item.message })),
  ...structuralStore.validation.warnings.map((item) => ({ type: 'warning' as const, text: item.message })),
]);
const solveErrors = computed(() => result.value?.diagnostics.errors ?? []);
const isFrameAnalysis = computed(() => structuralStore.model.modelType === 'space-frame');

const formatNumber = (value: number | undefined, digits = 4) => {
  if (value === undefined || !Number.isFinite(value)) return '-';
  if (value === 0) return '0';
  const absolute = Math.abs(value);
  return absolute >= 1e5 || absolute < 1e-3 ? value.toExponential(3) : value.toFixed(digits);
};

const runAction = (action: () => void) => {
  try {
    uiError.value = '';
    action();
  } catch (error) {
    uiError.value = error instanceof Error ? error.message : '操作失败。';
  }
};

const setAnalysisType = (value: AnalysisModelType | null) => {
  if (value === 'space-truss' || value === 'space-frame') structuralStore.setAnalysisType(value);
};

const addMaterialAndSection = () =>
  runAction(() => {
    if (!materialForm.id.trim() || !sectionForm.id.trim()) throw new Error('材料与截面编号不能为空。');
    if (materialForm.elasticModulus <= 0 || sectionForm.area <= 0) {
      throw new Error('弹性模量 E 与截面面积 A 必须大于零。');
    }
    if (!structuralStore.model.materials.some((item) => item.id === materialForm.id)) {
      structuralStore.addMaterial({
        id: materialForm.id,
        name: materialForm.name,
        elasticModulus: materialForm.elasticModulus,
        shearModulus: materialForm.shearModulus,
        yieldStrength: materialForm.yieldStrength,
      });
    }
    if (!structuralStore.model.sections.some((item) => item.id === sectionForm.id)) {
      structuralStore.addSection({ ...sectionForm });
    }
    memberForm.materialId = materialForm.id;
    memberForm.sectionId = sectionForm.id;
  });

const addNode = () =>
  runAction(() => {
    if (!nodeForm.id.trim()) throw new Error('节点编号不能为空。');
    structuralStore.addNode({
      id: nodeForm.id.trim(),
      x: Number(nodeForm.x),
      y: Number(nodeForm.y),
      z: Number(nodeForm.z),
      constraints: {
        ...emptyConstraints(),
        ux: nodeForm.ux,
        uy: nodeForm.uy,
        uz: nodeForm.uz,
        rx: nodeForm.rx,
        ry: nodeForm.ry,
        rz: nodeForm.rz,
      },
    });
    nodeForm.id = '';
  });

const addMember = () =>
  runAction(() => {
    if (!memberForm.id.trim()) throw new Error('杆件编号不能为空。');
    if (!memberForm.startNodeId || !memberForm.endNodeId) throw new Error('请选择杆件的起点和终点。');
    if (memberForm.startNodeId === memberForm.endNodeId) throw new Error('杆件两端不能是同一节点。');
    if (!memberForm.materialId || !memberForm.sectionId) throw new Error('请先添加并选择材料与截面。');
    structuralStore.addMember({
      id: memberForm.id.trim(),
      type: isFrameAnalysis.value ? 'frame3d' : 'truss3d',
      startNodeId: memberForm.startNodeId,
      endNodeId: memberForm.endNodeId,
      materialId: memberForm.materialId,
      sectionId: memberForm.sectionId,
    });
    memberForm.id = '';
  });

const addLoad = () =>
  runAction(() => {
    if (!loadForm.id.trim() || !loadForm.nodeId) throw new Error('载荷编号和作用节点不能为空。');
    structuralStore.addNodalLoad({
      id: loadForm.id.trim(),
      nodeId: loadForm.nodeId,
      force: { x: Number(loadForm.fx), y: Number(loadForm.fy), z: Number(loadForm.fz) },
      moment: {
        x: isFrameAnalysis.value ? Number(loadForm.mx) : 0,
        y: isFrameAnalysis.value ? Number(loadForm.my) : 0,
        z: isFrameAnalysis.value ? Number(loadForm.mz) : 0,
      },
      coordinateSystem: 'global',
      loadCaseId: 'LC1',
    });
    loadForm.id = '';
  });

const removeEntity = (collection: 'nodes' | 'members' | 'materials' | 'sections' | 'nodalLoads', id: string) =>
  runAction(() => {
    structuralStore.mutateModel((draft) => {
      if (collection === 'nodes') {
        draft.nodes = draft.nodes.filter((item) => item.id !== id);
        draft.members = draft.members.filter((item) => item.startNodeId !== id && item.endNodeId !== id);
        draft.nodalLoads = draft.nodalLoads.filter((item) => item.nodeId !== id);
      } else if (collection === 'members') draft.members = draft.members.filter((item) => item.id !== id);
      else if (collection === 'materials') draft.materials = draft.materials.filter((item) => item.id !== id);
      else if (collection === 'sections') draft.sections = draft.sections.filter((item) => item.id !== id);
      else draft.nodalLoads = draft.nodalLoads.filter((item) => item.id !== id);
    });
  });

const constraintLabel = (nodeId: string) => {
  const node = structuralStore.model.nodes.find((item) => item.id === nodeId);
  if (!node) return '-';
  const labels: Record<StructuralDof, string> = {
    ux: 'Ux',
    uy: 'Uy',
    uz: 'Uz',
    rx: 'Rx',
    ry: 'Ry',
    rz: 'Rz',
  };
  const dofs: StructuralDof[] = isFrameAnalysis.value
    ? ['ux', 'uy', 'uz', 'rx', 'ry', 'rz']
    : ['ux', 'uy', 'uz'];
  const active = dofs.filter((dof) => node.constraints[dof]).map((dof) => labels[dof]);
  return active.length ? active.join(', ') : '自由';
};

const solve = async () => {
  try {
    uiError.value = '';
    const solved = await solverStore.solve(structuralStore.model);
    structuralStore.setResult(solved);
    if (solved.diagnostics.errors.length > 0) uiError.value = solved.diagnostics.errors.join('；');
  } catch (error) {
    if (error instanceof Error && error.message === 'SOLVE_CANCELLED') return;
    uiError.value = error instanceof Error ? error.message : '本地结构求解失败。';
  }
};
</script>

<template>
  <div class="space-workbench" :class="{ 'space-workbench--inspector': props.inspectorOnly }">
    <aside class="space-workbench__editor">
      <header class="space-workbench__header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">空间杆系分析</div>
          <div class="text-caption text-medium-emphasis">模型版本 {{ structuralStore.model.revision }}</div>
        </div>
        <div class="space-workbench__actions">
          <v-btn icon="mdi-flask-outline" size="small" variant="text" title="载入校核模型" @click="structuralStore.loadSpaceTrussVerificationModel" />
          <v-btn icon="mdi-delete-outline" size="small" variant="text" title="清空空间模型" @click="structuralStore.clear" />
          <v-btn v-if="props.inspectorOnly" icon="mdi-chevron-double-right" size="small" variant="text" title="折叠属性面板" @click="uiStore.rightSidebarCollapsed = true" />
        </div>
      </header>

      <div class="space-workbench__scroll">
        <ComputeBackendPanel />

        <v-select
          :model-value="structuralStore.model.modelType"
          :items="analysisTypes"
          label="分析类型"
          density="compact"
          variant="outlined"
          @update:model-value="setAnalysisType"
        />

        <v-alert v-if="structuralStore.resultIsStale" type="warning" density="compact" variant="tonal" class="mb-3">
          模型已修改，旧结果已失效，请重新求解。
        </v-alert>
        <v-alert v-if="uiError" type="error" density="compact" variant="tonal" closable class="mb-3" @click:close="uiError = ''">
          {{ uiError }}
        </v-alert>

        <v-expansion-panels v-model="activePanel" multiple variant="accordion">
          <v-expansion-panel value="model">
            <v-expansion-panel-title>
              材料与截面
              <template #actions>
                <span class="panel-count">{{ structuralStore.model.materials.length }}/{{ structuralStore.model.sections.length }}</span>
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="form-grid form-grid--2">
                <v-text-field v-model="materialForm.id" label="材料编号" density="compact" variant="outlined" />
                <v-text-field v-model="materialForm.name" label="材料名称" density="compact" variant="outlined" />
                <v-text-field v-model.number="materialForm.elasticModulus" label="E / Pa" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="materialForm.shearModulus" label="G / Pa" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="materialForm.yieldStrength" label="屈服强度 / Pa" type="number" density="compact" variant="outlined" />
                <v-text-field v-model="sectionForm.id" label="截面编号" density="compact" variant="outlined" />
                <v-text-field v-model="sectionForm.name" label="截面名称" density="compact" variant="outlined" />
                <v-text-field v-model.number="sectionForm.area" label="A / m²" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="sectionForm.iy" label="Iy / m⁴" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="sectionForm.iz" label="Iz / m⁴" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="sectionForm.torsionConstant" label="J / m⁴" type="number" density="compact" variant="outlined" />
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" height="40" @click="addMaterialAndSection">添加</v-btn>
              </div>
              <div class="entity-chips">
                <v-chip
                  v-for="material in structuralStore.model.materials"
                  :key="material.id"
                  size="small"
                  closable
                  @click:close="removeEntity('materials', material.id)"
                >
                  {{ material.id }} · E={{ formatNumber(material.elasticModulus, 2) }}
                </v-chip>
                <v-chip
                  v-for="section in structuralStore.model.sections"
                  :key="section.id"
                  size="small"
                  closable
                  @click:close="removeEntity('sections', section.id)"
                >
                  {{ section.id }} · A={{ formatNumber(section.area) }}
                </v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="nodes">
            <v-expansion-panel-title>
              节点与约束
              <template #actions><span class="panel-count">{{ structuralStore.model.nodes.length }}</span></template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="form-grid form-grid--4">
                <v-text-field v-model="nodeForm.id" label="编号" density="compact" variant="outlined" />
                <v-text-field v-model.number="nodeForm.x" label="X / m" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="nodeForm.y" label="Y / m" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="nodeForm.z" label="Z / m" type="number" density="compact" variant="outlined" />
              </div>
              <div class="constraint-row">
                <v-checkbox v-model="nodeForm.ux" label="约束 Ux" density="compact" hide-details />
                <v-checkbox v-model="nodeForm.uy" label="约束 Uy" density="compact" hide-details />
                <v-checkbox v-model="nodeForm.uz" label="约束 Uz" density="compact" hide-details />
                <v-checkbox v-if="isFrameAnalysis" v-model="nodeForm.rx" label="约束 Rx" density="compact" hide-details />
                <v-checkbox v-if="isFrameAnalysis" v-model="nodeForm.ry" label="约束 Ry" density="compact" hide-details />
                <v-checkbox v-if="isFrameAnalysis" v-model="nodeForm.rz" label="约束 Rz" density="compact" hide-details />
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addNode">添加节点</v-btn>
              </div>
              <v-table density="compact" class="data-table">
                <thead><tr><th>节点</th><th>X</th><th>Y</th><th>Z</th><th>约束</th><th></th></tr></thead>
                <tbody>
                  <tr
                    v-for="node in structuralStore.model.nodes"
                    :key="node.id"
                    :class="{ selected: structuralStore.selectedNodeId === node.id }"
                    @click="structuralStore.selectedNodeId = node.id"
                  >
                    <td>{{ node.id }}</td><td>{{ node.x }}</td><td>{{ node.y }}</td><td>{{ node.z }}</td>
                    <td>{{ constraintLabel(node.id) }}</td>
                    <td><v-btn icon="mdi-close" size="x-small" variant="text" title="删除节点" @click.stop="removeEntity('nodes', node.id)" /></td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="members">
            <v-expansion-panel-title>
              杆件
              <template #actions><span class="panel-count">{{ structuralStore.model.members.length }}</span></template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="form-grid form-grid--2">
                <v-text-field v-model="memberForm.id" label="杆件编号" density="compact" variant="outlined" />
                <v-select v-model="memberForm.startNodeId" :items="nodeOptions" label="起点" density="compact" variant="outlined" />
                <v-select v-model="memberForm.endNodeId" :items="nodeOptions" label="终点" density="compact" variant="outlined" />
                <v-select v-model="memberForm.materialId" :items="materialOptions" label="材料" density="compact" variant="outlined" />
                <v-select v-model="memberForm.sectionId" :items="sectionOptions" label="截面" density="compact" variant="outlined" />
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" height="40" @click="addMember">添加杆件</v-btn>
              </div>
              <v-table density="compact" class="data-table">
                <thead><tr><th>杆件</th><th>起点</th><th>终点</th><th>材料/截面</th><th></th></tr></thead>
                <tbody>
                  <tr
                    v-for="member in structuralStore.model.members"
                    :key="member.id"
                    :class="{ selected: structuralStore.selectedMemberId === member.id }"
                    @click="structuralStore.selectedMemberId = member.id"
                  >
                    <td>{{ member.id }}</td><td>{{ member.startNodeId }}</td><td>{{ member.endNodeId }}</td>
                    <td>{{ member.materialId }}/{{ member.sectionId }}</td>
                    <td><v-btn icon="mdi-close" size="x-small" variant="text" title="删除杆件" @click.stop="removeEntity('members', member.id)" /></td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="loads">
            <v-expansion-panel-title>
              节点荷载
              <template #actions><span class="panel-count">{{ structuralStore.model.nodalLoads.length }}</span></template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="form-grid form-grid--2">
                <v-text-field v-model="loadForm.id" label="载荷编号" density="compact" variant="outlined" />
                <v-select v-model="loadForm.nodeId" :items="nodeOptions" label="作用节点" density="compact" variant="outlined" />
                <v-text-field v-model.number="loadForm.fx" label="Fx / N" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="loadForm.fy" label="Fy / N" type="number" density="compact" variant="outlined" />
                <v-text-field v-model.number="loadForm.fz" label="Fz / N" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="loadForm.mx" label="Mx / N·m" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="loadForm.my" label="My / N·m" type="number" density="compact" variant="outlined" />
                <v-text-field v-if="isFrameAnalysis" v-model.number="loadForm.mz" label="Mz / N·m" type="number" density="compact" variant="outlined" />
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" height="40" @click="addLoad">添加荷载</v-btn>
              </div>
              <v-table density="compact" class="data-table">
                <thead><tr><th>荷载</th><th>节点</th><th>Fx</th><th>Fy</th><th>Fz</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="load in structuralStore.model.nodalLoads" :key="load.id">
                    <td>{{ load.id }}</td><td>{{ load.nodeId }}</td>
                    <td>{{ load.force.x }}</td><td>{{ load.force.y }}</td><td>{{ load.force.z }}</td>
                    <td><v-btn icon="mdi-close" size="x-small" variant="text" title="删除荷载" @click.stop="removeEntity('nodalLoads', load.id)" /></td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <section class="solve-section">
          <div class="solve-section__status">
            <v-icon :color="structuralStore.validation.valid ? 'success' : 'error'" size="small">
              {{ structuralStore.validation.valid ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}
            </v-icon>
            <span>{{ structuralStore.validation.valid ? '模型校核通过' : `${structuralStore.validation.errors.length} 项校核错误` }}</span>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-calculator-variant-outline"
            :disabled="!structuralStore.validation.valid || solverStore.isSolving"
            :loading="solverStore.isSolving"
            @click="solve"
          >
            本地求解
          </v-btn>
          <v-btn
            v-if="solverStore.isSolving"
            icon="mdi-stop-circle-outline"
            color="error"
            variant="text"
            title="取消本地求解"
            @click="solverStore.cancel"
          />
        </section>

        <v-progress-linear
          v-if="solverStore.isSolving"
          :model-value="solverStore.progress.progress * 100"
          color="primary"
          height="5"
          class="mb-2"
        />
        <div v-if="solverStore.isSolving" class="text-caption mb-2">
          {{ solverStore.progress.stage }}
        </div>
        <v-alert v-if="solverStore.lastError" type="error" density="compact" variant="tonal" class="mb-2">
          {{ solverStore.lastError }}
        </v-alert>

        <v-alert
          v-for="(message, index) in validationMessages"
          :key="`${message.type}-${index}`"
          :type="message.type"
          density="compact"
          variant="text"
          class="validation-message"
        >
          {{ message.text }}
        </v-alert>
        <v-alert v-for="message in solveErrors" :key="message" type="error" density="compact" variant="tonal" class="mb-2">
          {{ message }}
        </v-alert>

        <section v-if="result && result.diagnostics.errors.length === 0" class="results-section">
          <h3>节点结果</h3>
          <v-table density="compact" class="data-table">
            <thead><tr><th>节点</th><th>Ux</th><th>Uy</th><th>Uz</th><th>Rxn X</th><th>Rxn Y</th><th>Rxn Z</th></tr></thead>
            <tbody>
              <tr v-for="(nodeResult, nodeId) in result.nodeResults" :key="nodeId">
                <td>{{ nodeId }}</td>
                <td>{{ formatNumber(nodeResult.displacement.ux) }}</td>
                <td>{{ formatNumber(nodeResult.displacement.uy) }}</td>
                <td>{{ formatNumber(nodeResult.displacement.uz) }}</td>
                <td>{{ formatNumber(nodeResult.reaction?.fx) }}</td>
                <td>{{ formatNumber(nodeResult.reaction?.fy) }}</td>
                <td>{{ formatNumber(nodeResult.reaction?.fz) }}</td>
              </tr>
            </tbody>
          </v-table>
          <h3>杆件结果</h3>
          <v-table density="compact" class="data-table">
            <thead><tr><th>杆件</th><th>轴力 N / N</th><th>正应力 σ / Pa</th><th>安全系数</th></tr></thead>
            <tbody>
              <tr v-for="(memberResult, memberId) in result.memberResults" :key="memberId">
                <td>{{ memberId }}</td>
                <td>{{ formatNumber(memberResult.stations[0]?.axialForce) }}</td>
                <td>{{ formatNumber(memberResult.stations[0]?.normalStress) }}</td>
                <td>{{ formatNumber(memberResult.stations[0]?.safetyFactor) }}</td>
              </tr>
            </tbody>
          </v-table>
        </section>
      </div>
    </aside>

    <main v-if="!props.inspectorOnly" class="space-workbench__viewer">
      <StructuralViewportHost id="space-analysis-viewer" />
      <div v-if="structuralStore.model.nodes.length === 0" class="empty-viewer">
        <v-icon icon="mdi-vector-polyline" size="34" />
        <span>添加节点与杆件，或载入校核模型</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.space-workbench {
  display: grid;
  grid-template-columns: minmax(360px, 430px) minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  background: rgb(var(--v-theme-surface));
}

.space-workbench--inspector {
  display: block;
  height: 100%;
  background: var(--bg-panel);
}

.space-workbench--inspector .space-workbench__editor {
  width: 100%;
  height: 100%;
  border-right: 0;
  background: var(--bg-panel);
}

.space-workbench--inspector .space-workbench__header {
  min-height: 56px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-strong);
  box-shadow: inset 0 -2px 0 var(--accent);
}

.space-workbench--inspector .space-workbench__scroll { padding: 10px; }
.space-workbench--inspector .space-workbench__header .text-subtitle-1 { font-size: 14px !important; }
.space-workbench--inspector .space-workbench__header .text-caption { color: var(--text-muted) !important; font-size: 10px !important; }
.space-workbench--inspector :deep(.v-expansion-panel) { background: var(--bg-panel); color: var(--text-primary); }
.space-workbench--inspector :deep(.v-expansion-panel-title) { min-height: 38px; padding: 0 10px; font-size: 12px; }
.space-workbench--inspector :deep(.v-expansion-panel-text__wrapper) { padding: 9px 8px 11px; }
.space-workbench--inspector :deep(.v-field) { background: var(--bg-input); font-size: 11px; }
.space-workbench--inspector :deep(input) { font-family: var(--font-mono); font-size: 11px; }
.space-workbench--inspector :deep(.v-label) { font-size: 11px; letter-spacing: 0; }
.space-workbench--inspector :deep(.v-table) { background: var(--bg-panel); color: var(--text-secondary); }
.space-workbench--inspector :deep(.v-table th) { background: var(--bg-toolbar) !important; color: var(--text-secondary); }
.space-workbench--inspector :deep(.v-table td) { background: var(--bg-panel) !important; color: var(--text-secondary); }
.space-workbench--inspector :deep(.v-table tr:hover td) { background: var(--bg-hover) !important; }

.space-workbench__editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--border-default);
  background: var(--bg-panel);
}

.space-workbench__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-strong);
}

.space-workbench__actions,
.constraint-row,
.entity-chips,
.solve-section,
.solve-section__status {
  display: flex;
  align-items: center;
}

.space-workbench__scroll {
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.form-grid {
  display: grid;
  gap: 0 8px;
}

.form-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

.constraint-row {
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-bottom: 8px;
}

.constraint-row :deep(.v-checkbox) { flex: 1 1 90px; }
.constraint-row .v-btn { margin-left: auto; }

.entity-chips {
  flex-wrap: wrap;
  gap: 6px;
}

.panel-count {
  min-width: 28px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-selected);
  color: var(--accent-strong);
  font-size: 11px;
  text-align: center;
}

.data-table {
  border: 1px solid var(--border-default);
  font-size: 12px;
}

.data-table th {
  white-space: nowrap;
  background: var(--bg-toolbar);
}

.data-table tr { cursor: pointer; }
.data-table tr.selected { background: rgba(253, 183, 20, 0.16); }

.solve-section {
  position: sticky;
  bottom: -12px;
  z-index: 3;
  justify-content: space-between;
  gap: 12px;
  margin: 12px -12px 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-panel);
}

.solve-section__status { gap: 6px; font-size: 13px; }
.validation-message { margin: 0; padding-top: 2px; padding-bottom: 2px; }

.results-section {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 3px solid #fdb714;
}

.results-section h3 {
  margin: 8px 0 6px;
  font-size: 14px;
}

.space-workbench__viewer {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.empty-viewer {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  color: rgba(25, 45, 70, 0.55);
  font-size: 13px;
  pointer-events: none;
}

@media (max-width: 980px) {
  .space-workbench {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(360px, 46%) minmax(360px, 54%);
    overflow: auto;
  }

  .space-workbench__editor { border-right: 0; border-bottom: 1px solid rgba(0, 53, 122, 0.16); }
}

@media (max-width: 520px) {
  .form-grid--4,
  .form-grid--2 { grid-template-columns: 1fr 1fr; }
}
</style>
