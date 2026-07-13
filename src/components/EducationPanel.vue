<template>
  <div class="education-panel" :style="`height: ${props.height}px`">
    <div class="education-panel__toolbar border-b border-t">
      <v-btn
        v-for="view in views"
        :key="view.id"
        size="small"
        variant="flat"
        :color="activeView === view.id ? 'primary' : 'secondary'"
        :rounded="0"
        @click="activeView = view.id"
      >
        <v-icon small>{{ view.icon }}</v-icon> {{ $t(view.label) }}
      </v-btn>
      <v-btn size="small" variant="flat" color="secondary" :rounded="0" @click="solveAndShowCritical">
        <v-icon small>mdi-shield-search</v-icon> {{ $t('education.solveAndCheck') }}
      </v-btn>
    </div>

    <div class="education-panel__body" :style="`height: ${props.height - 31}px`">
      <section v-if="activeView === 'templates'" class="education-panel__section">
        <div class="education-template-grid">
          <button
            v-for="template in educationTemplates"
            :key="template.id"
            class="education-template"
            type="button"
            @click="applyTemplate(template.id)"
          >
            <v-icon size="22">{{ template.icon }}</v-icon>
            <span class="education-template__title">{{ $t(template.titleKey) }}</span>
            <span class="education-template__description">{{ $t(template.descriptionKey) }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="activeView === 'derivation'" class="education-panel__section">
        <div class="education-panel__grid">
          <div class="education-panel__block">
            <h3>{{ $t('education.derivation.equilibrium') }}</h3>
            <ul>
              <li>{{ $t('education.derivation.globalEquilibrium') }}</li>
              <li>
                {{
                  $t('education.derivation.modelStats', {
                    nodes: derivation.nodeCount,
                    elements: derivation.elementCount,
                    nodalLoads: derivation.nodalLoadCount,
                    elementLoads: derivation.elementLoadCount,
                    prescribed: derivation.prescribedCount,
                  })
                }}
              </li>
              <li>{{ $t('education.derivation.elementEquilibrium') }}</li>
            </ul>
          </div>

          <div class="education-panel__block">
            <h3>{{ $t('education.derivation.symbolConvention') }}</h3>
            <ul>
              <li>{{ $t('education.derivation.symbolX') }}</li>
              <li>{{ $t('education.derivation.symbolForces') }}</li>
              <li>{{ $t('education.derivation.symbolStress') }}</li>
            </ul>
          </div>
        </div>

        <div class="education-panel__block">
          <h3>{{ $t('education.derivation.boundaryConditions') }}</h3>
          <table class="education-table">
            <thead>
              <tr>
                <th>{{ $t('common.node') }}</th>
                <th>Dx</th>
                <th>Dz</th>
                <th>Ry</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in derivation.boundaryRows" :key="row.node">
                <td>{{ row.node }}</td>
                <td>{{ supportText(row.dx) }}</td>
                <td>{{ supportText(row.dz) }}</td>
                <td>{{ supportText(row.ry) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="education-panel__block">
          <h3>{{ $t('education.derivation.internalForceEquations') }}</h3>
          <table class="education-table">
            <thead>
              <tr>
                <th>{{ $t('common.element') }}</th>
                <th>{{ $t('education.derivation.span') }}</th>
                <th>EA</th>
                <th>EI</th>
                <th>{{ $t('common.normalForce') }}</th>
                <th>{{ $t('common.shearForce') }}</th>
                <th>{{ $t('common.bendingMoment') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="element in derivation.elements" :key="element.label">
                <td>{{ element.label }}</td>
                <td>{{ element.startNode }}-{{ element.endNode }}, L={{ formatLength(element.length) }}</td>
                <td>{{ formatScientificNumber(element.axialRigidity) }}</td>
                <td>{{ formatScientificNumber(element.bendingRigidity) }}</td>
                <td>{{ formatForce(element.maxNormalForce) }}</td>
                <td>{{ formatForce(element.maxShearForce) }}</td>
                <td>{{ formatMoment(element.maxBendingMoment) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeView === 'combined'" class="education-panel__section">
        <div class="education-panel__grid education-panel__grid--wide">
          <div class="education-panel__block">
            <h3>{{ $t('education.combined.inputs') }}</h3>
            <div class="education-combined-form">
              <v-text-field
                v-for="field in combinedInputFields"
                :key="field.key"
                v-model="combinedInputs[field.key]"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :label="$t(field.label)"
                :suffix="field.suffix"
                :rounded="0"
                @keydown="checkNumber($event)"
              ></v-text-field>
            </div>
            <p class="education-panel__note">{{ $t('education.combined.inputNote') }}</p>
          </div>

          <div class="education-panel__block">
            <h3>{{ $t('education.combined.formulas') }}</h3>
            <ul>
              <li>{{ $t('education.combined.formulaNormal') }}</li>
              <li>{{ $t('education.combined.formulaShear') }}</li>
              <li>{{ $t('education.combined.formulaVonMises') }}</li>
              <li>{{ $t('education.combined.formulaDeformation') }}</li>
            </ul>
          </div>
        </div>

        <div v-if="!combinedAnalysis.ok" class="education-panel__empty">
          <v-icon size="24">mdi-alert-circle-outline</v-icon>
          <span>{{ $t('education.combined.invalid') }}</span>
        </div>

        <div v-else class="education-panel__block">
          <h3>{{ $t('education.combined.results') }}</h3>
          <table class="education-table">
            <thead>
              <tr>
                <th>{{ $t('education.combined.item') }}</th>
                <th>{{ $t('education.combined.expression') }}</th>
                <th>{{ $t('education.combined.value') }}</th>
                <th>{{ $t('education.combined.meaning') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in combinedRows"
                :key="row.key"
                :class="{ 'education-table__warn': row.warn }"
              >
                <td>{{ row.label }}</td>
                <td>{{ row.expression }}</td>
                <td>{{ row.value }}</td>
                <td>{{ row.meaning }}</td>
              </tr>
            </tbody>
          </table>
          <p class="education-panel__note">{{ $t('education.combined.note') }}</p>
        </div>
      </section>

      <section v-else-if="activeView === 'space3d'" class="education-panel__section">
        <div class="education-panel__grid education-panel__grid--wide">
          <div class="education-panel__block">
            <h3>{{ $t('education.space3d.modelTitle') }}</h3>
            <ul>
              <li>{{ $t('education.space3d.modelNodes') }}</li>
              <li>{{ $t('education.space3d.modelElement') }}</li>
              <li>{{ $t('education.space3d.modelLoad') }}</li>
              <li>{{ $t('education.space3d.modelSection') }}</li>
            </ul>
          </div>

          <div class="education-panel__block">
            <h3>{{ $t('education.space3d.extremeTitle') }}</h3>
            <div class="education-3d-extremes">
              <div v-for="item in space3dExtremeCards" :key="item.key" class="education-3d-extreme">
                <span class="education-3d-extreme__label">{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <span>{{ item.location }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="education-panel__block">
          <h3>{{ $t('education.space3d.criticalTitle') }}</h3>
          <table class="education-table">
            <thead>
              <tr>
                <th>{{ $t('education.critical.item') }}</th>
                <th>{{ $t('common.element') }}</th>
                <th>{{ $t('common.node') }}</th>
                <th>x</th>
                <th>{{ $t('education.critical.value') }}</th>
                <th>{{ $t('education.space3d.component') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in space3dRows" :key="row.key" :class="{ 'education-table__warn': row.warn }">
                <td>{{ row.label }}</td>
                <td>{{ row.element }}</td>
                <td>{{ row.node }}</td>
                <td>{{ row.position }}</td>
                <td>{{ row.value }}</td>
                <td>{{ row.component }}</td>
              </tr>
            </tbody>
          </table>
          <p class="education-panel__note">{{ $t('education.space3d.note') }}</p>
        </div>
      </section>

      <section v-else class="education-panel__section">
        <div v-if="!critical.solved" class="education-panel__empty">
          <v-icon size="24">mdi-alert-circle-outline</v-icon>
          <span>{{ $t('education.critical.notSolved') }}</span>
        </div>

        <div v-else class="education-panel__block">
          <h3>{{ $t('education.critical.title') }}</h3>
          <table class="education-table">
            <thead>
              <tr>
                <th>{{ $t('education.critical.item') }}</th>
                <th>{{ $t('common.element') }}</th>
                <th>x</th>
                <th>{{ $t('education.critical.value') }}</th>
                <th>{{ $t('education.critical.limit') }}</th>
                <th>{{ $t('education.critical.ratio') }}</th>
                <th>{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in criticalRows" :key="row.key" :class="{ 'education-table__warn': row.warn }">
                <td>{{ row.label }}</td>
                <td>{{ row.item?.elementLabel ?? '-' }}</td>
                <td>{{ row.item ? formatLength(row.item.position) : '-' }}</td>
                <td>{{ row.value }}</td>
                <td>{{ row.limit }}</td>
                <td>{{ row.ratio }}</td>
                <td>
                  <v-btn
                    v-if="row.item"
                    density="compact"
                    variant="text"
                    icon="mdi-crosshairs-gps"
                    @click="focusElement(row.item.elementLabel)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="education-panel__note">{{ $t('education.critical.note') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/store/app';
import { useProjectStore } from '@/store/project';
import { useSymbolStore } from '@/store/symbols';
import { eventBus, EventType } from '@/EventBus';
import {
  analyzeSpaceFrame3DPostprocess,
  checkNumber,
  formatScientificNumber,
  solveSpaceFrame3D,
  type CriticalLocation3D,
  type SpaceFrameModelInput,
} from '@/utils';
import {
  calculateCombinedDeformation,
  type CombinedDeformationInputKey,
  type CombinedDeformationResult,
} from '@/utils/combinedDeformation';
import { analyzeCriticalSections, buildDerivationSummary, type CriticalResult } from '@/utils/educationAnalysis';
import { applyEducationTemplate, educationTemplates, type EducationTemplateId } from '@/utils/educationTemplates';

const props = defineProps({
  height: {
    type: Number,
    default: 180,
  },
});

const { t } = useI18n();
const appStore = useAppStore();
const projectStore = useProjectStore();
const symbolStore = useSymbolStore();
const activeView = ref<'templates' | 'derivation' | 'combined' | 'space3d' | 'critical'>('templates');

const views = [
  { id: 'templates', label: 'education.views.templates', icon: 'mdi-view-grid-plus' },
  { id: 'derivation', label: 'education.views.derivation', icon: 'mdi-format-list-numbered' },
  { id: 'combined', label: 'education.views.combined', icon: 'mdi-axis-arrow' },
  { id: 'space3d', label: 'education.views.space3d', icon: 'mdi-cube-scan' },
  { id: 'critical', label: 'education.views.critical', icon: 'mdi-shield-alert-outline' },
] as const;

const combinedInputs = ref<Record<CombinedDeformationInputKey, string>>({
  N: '10e3',
  M: '2e3',
  T: '1e3',
  A: '2e-3',
  W: '4e-5',
  Wt: '8e-5',
  I: '8e-6',
  J: '1.6e-5',
  E: '210e9',
  G: '80e9',
  L: '1.5',
  fy: '235e6',
});

const combinedInputFields: Array<{
  key: CombinedDeformationInputKey;
  label: string;
  suffix: string;
}> = [
  { key: 'N', label: 'education.combined.fields.N', suffix: 'N' },
  { key: 'M', label: 'education.combined.fields.M', suffix: 'N·m' },
  { key: 'T', label: 'education.combined.fields.T', suffix: 'N·m' },
  { key: 'A', label: 'education.combined.fields.A', suffix: 'm²' },
  { key: 'W', label: 'education.combined.fields.W', suffix: 'm³' },
  { key: 'Wt', label: 'education.combined.fields.Wt', suffix: 'm³' },
  { key: 'I', label: 'education.combined.fields.I', suffix: 'm⁴' },
  { key: 'J', label: 'education.combined.fields.J', suffix: 'm⁴' },
  { key: 'E', label: 'education.combined.fields.E', suffix: 'Pa' },
  { key: 'G', label: 'education.combined.fields.G', suffix: 'Pa' },
  { key: 'L', label: 'education.combined.fields.L', suffix: 'm' },
  { key: 'fy', label: 'education.combined.fields.fy', suffix: 'Pa' },
];

const derivation = computed(() => buildDerivationSummary());
const critical = computed(() =>
  analyzeCriticalSections(Number(symbolStore.scope.fy ?? 235) * 1e6, Number(symbolStore.scope.tau ?? 120) * 1e6)
);

const demoSpaceFrameModel = computed<SpaceFrameModelInput>(() => ({
  nodes: [
    { label: 'A', coords: [0, 0, 0], constraints: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true } },
    { label: 'B', coords: ['L3D', 0, 0] },
  ],
  materials: [{ label: 'steel', E: 'E3D', G: 'G3D', yieldStrength: 'fy3D' }],
  sections: [{ label: 'box', A: 'A3D', Iy: 'Iy3D', Iz: 'Iz3D', J: 'J3D', Wy: 'Wy3D', Wz: 'Wz3D', Wt: 'Wt3D' }],
  elements: [{ label: 'AB', nodes: ['A', 'B'], material: 'steel', section: 'box' }],
  nodalLoads: [{ node: 'B', values: ['Fx3D', 'Fy3D', 'Fz3D', 'Tx3D', 0, 0] }],
  symbols: {
    L3D: Number(symbolStore.scope.L3D ?? 2),
    E3D: Number(symbolStore.scope.E3D ?? 210e9),
    G3D: Number(symbolStore.scope.G3D ?? 80e9),
    fy3D: Number(symbolStore.scope.fy3D ?? 235e6),
    A3D: Number(symbolStore.scope.A3D ?? 0.01),
    Iy3D: Number(symbolStore.scope.Iy3D ?? 1e-5),
    Iz3D: Number(symbolStore.scope.Iz3D ?? 2e-5),
    J3D: Number(symbolStore.scope.J3D ?? 3e-5),
    Wy3D: Number(symbolStore.scope.Wy3D ?? 2e-4),
    Wz3D: Number(symbolStore.scope.Wz3D ?? 4e-4),
    Wt3D: Number(symbolStore.scope.Wt3D ?? 3e-4),
    Fx3D: Number(symbolStore.scope.Fx3D ?? 10_000),
    Fy3D: Number(symbolStore.scope.Fy3D ?? 5_000),
    Fz3D: Number(symbolStore.scope.Fz3D ?? 3_000),
    Tx3D: Number(symbolStore.scope.Tx3D ?? 2_000),
  },
}));

const space3dResult = computed(() => solveSpaceFrame3D(demoSpaceFrameModel.value));
const space3dAnalysis = computed(() =>
  analyzeSpaceFrame3DPostprocess(space3dResult.value, {
    normalStressLimit: Number(demoSpaceFrameModel.value.symbols.fy3D),
    shearStressLimit: Number(symbolStore.scope.tau3D ?? 120e6),
  })
);

const formatLength = (value: number) => `${formatScientificNumber(appStore.convertLength(value))} ${appStore.units.Length}`;
const formatForce = (value: number) => `${formatScientificNumber(appStore.convertForce(value))} ${appStore.units.Force}`;
const formatMoment = (value: number) => `${formatScientificNumber(appStore.convertMoment(value))} ${appStore.units.Moment}`;
const formatPressure = (value: number) =>
  `${formatScientificNumber(appStore.convertPressure(value))} ${appStore.units.Pressure}`;
const formatStrain = (value: number) => formatScientificNumber(value);
const formatCurvature = (value: number) => `${formatScientificNumber(value)} 1/m`;
const formatAngle = (value: number, valueDeg: number) =>
  `${formatScientificNumber(value)} rad (${formatScientificNumber(valueDeg)}°)`;

const supportText = (fixed: boolean) => (fixed ? t('education.derivation.fixed') : t('education.derivation.free'));

const formatSpace3DValue = (item: CriticalLocation3D | null) => {
  if (!item) return '-';
  if (item.kind === 'displacement') return formatLength(item.value);
  if (item.kind === 'normalStress' || item.kind === 'shearStress') return formatPressure(item.value);
  if (item.kind === 'bendingMoment' || item.kind === 'torque') return formatMoment(item.value);
  if (item.kind === 'safetyFactor') return `${formatScientificNumber(item.value)}x`;
  return formatForce(item.value);
};

const formatSpace3DLocation = (item: CriticalLocation3D | null) => {
  if (!item) return '-';
  if (item.nodeLabel) return `${t('common.node')} ${item.nodeLabel}`;
  if (item.elementLabel) return `${t('common.element')} ${item.elementLabel}`;
  return '-';
};

const formatSpace3DPosition = (item: CriticalLocation3D | null) =>
  item?.position !== undefined ? formatLength(item.position) : '-';

const solveAndShowCritical = () => {
  projectStore.solve();
  activeView.value = 'critical';
};

const applyTemplate = async (id: EducationTemplateId) => {
  if (!window.confirm(t('education.templates.replaceConfirm'))) return;

  applyEducationTemplate(id);
  activeView.value = 'derivation';

  await nextTick();
  eventBus.emit(EventType.FIT_CONTENT);
};

const ratioText = (item: CriticalResult | null) => {
  if (!item?.ratio || !Number.isFinite(item.ratio)) return '-';
  return `${formatScientificNumber(item.ratio)}x`;
};

const utilizationText = (item: CriticalResult | null) => {
  if (!item?.ratio || !Number.isFinite(item.ratio)) return '-';
  return `${formatScientificNumber(item.ratio * 100)}%`;
};

const criticalRows = computed(() => [
  {
    key: 'normalStress',
    label: t('education.critical.maxNormalStress'),
    item: critical.value.maxNormalStress,
    value: critical.value.maxNormalStress ? formatPressure(critical.value.maxNormalStress.value) : '-',
    limit: critical.value.maxNormalStress?.limit ? formatPressure(critical.value.maxNormalStress.limit) : '-',
    ratio: utilizationText(critical.value.maxNormalStress),
    warn: (critical.value.maxNormalStress?.ratio ?? 0) > 1,
  },
  {
    key: 'shearStress',
    label: t('education.critical.maxShearStress'),
    item: critical.value.maxShearStress,
    value: critical.value.maxShearStress ? formatPressure(critical.value.maxShearStress.value) : '-',
    limit: critical.value.maxShearStress?.limit ? formatPressure(critical.value.maxShearStress.limit) : '-',
    ratio: utilizationText(critical.value.maxShearStress),
    warn: (critical.value.maxShearStress?.ratio ?? 0) > 1,
  },
  {
    key: 'deflection',
    label: t('education.critical.maxDeflection'),
    item: critical.value.maxDeflection,
    value: critical.value.maxDeflection ? formatLength(critical.value.maxDeflection.value) : '-',
    limit: critical.value.maxDeflection?.limit ? formatLength(critical.value.maxDeflection.limit) : '-',
    ratio: utilizationText(critical.value.maxDeflection),
    warn: (critical.value.maxDeflection?.ratio ?? 0) > 1,
  },
  {
    key: 'safety',
    label: t('education.critical.safetyFactor'),
    item: critical.value.safetyFactor,
    value: ratioText(critical.value.safetyFactor),
    limit: '>= 1.0',
    ratio: ratioText(critical.value.safetyFactor),
    warn: (critical.value.safetyFactor?.ratio ?? 1) < 1,
  },
]);

const space3dExtremeCards = computed(() => [
  {
    key: 'displacement',
    label: t('education.space3d.maxDisplacement'),
    value: formatSpace3DValue(space3dAnalysis.value.maxDisplacement),
    location: formatSpace3DLocation(space3dAnalysis.value.maxDisplacement),
  },
  {
    key: 'normalStress',
    label: t('education.space3d.maxNormalStress'),
    value: formatSpace3DValue(space3dAnalysis.value.maxNormalStress),
    location: formatSpace3DLocation(space3dAnalysis.value.maxNormalStress),
  },
  {
    key: 'shearStress',
    label: t('education.space3d.maxShearStress'),
    value: formatSpace3DValue(space3dAnalysis.value.maxShearStress),
    location: formatSpace3DLocation(space3dAnalysis.value.maxShearStress),
  },
  {
    key: 'safetyFactor',
    label: t('education.space3d.minSafetyFactor'),
    value: formatSpace3DValue(space3dAnalysis.value.minSafetyFactor),
    location: formatSpace3DLocation(space3dAnalysis.value.minSafetyFactor),
  },
]);

const space3dKindLabel = (item: CriticalLocation3D) => {
  const labels: Record<CriticalLocation3D['kind'], string> = {
    displacement: t('education.space3d.maxDisplacement'),
    axialForce: t('education.space3d.maxAxialForce'),
    shearForce: t('education.space3d.maxShearForce'),
    torque: t('education.space3d.maxTorque'),
    bendingMoment: t('education.space3d.maxBendingMoment'),
    normalStress: t('education.space3d.maxNormalStress'),
    shearStress: t('education.space3d.maxShearStress'),
    safetyFactor: t('education.space3d.minSafetyFactor'),
  };

  return labels[item.kind];
};

const space3dRows = computed(() =>
  space3dAnalysis.value.criticalLocations.map((item, index) => ({
    key: `${item.kind}-${index}`,
    label: space3dKindLabel(item),
    element: item.elementLabel ?? '-',
    node: item.nodeLabel ?? '-',
    position: formatSpace3DPosition(item),
    value: formatSpace3DValue(item),
    component: item.component ?? '-',
    warn:
      (item.kind === 'normalStress' || item.kind === 'shearStress') && item.ratio !== undefined
        ? item.ratio > 1
        : item.kind === 'safetyFactor'
          ? item.value < 1
          : false,
  }))
);

const combinedAnalysis = computed<
  | { ok: true; result: CombinedDeformationResult }
  | {
      ok: false;
      error: unknown;
    }
>(() => {
  try {
    return {
      ok: true,
      result: calculateCombinedDeformation(combinedInputs.value, symbolStore.scope),
    };
  } catch (error) {
    return { ok: false, error };
  }
});

const combinedRows = computed(() => {
  if (!combinedAnalysis.value.ok) return [];

  const result = combinedAnalysis.value.result;

  return [
    {
      key: 'axialStress',
      label: t('education.combined.rows.axialStress'),
      expression: 'σN = N / A',
      value: formatPressure(result.axialStress),
      meaning: t('education.combined.meanings.axialStress'),
      warn: false,
    },
    {
      key: 'bendingStress',
      label: t('education.combined.rows.bendingStress'),
      expression: 'σM = M / W',
      value: formatPressure(result.bendingStress),
      meaning: t('education.combined.meanings.bendingStress'),
      warn: false,
    },
    {
      key: 'criticalNormalStress',
      label: t('education.combined.rows.criticalNormalStress'),
      expression: 'σmax = N/A ± |M/W|',
      value: formatPressure(result.criticalNormalStress),
      meaning: t('education.combined.meanings.criticalNormalStress'),
      warn: Math.abs(result.criticalNormalStress) > result.values.fy,
    },
    {
      key: 'torsionalShearStress',
      label: t('education.combined.rows.torsionalShearStress'),
      expression: 'τT = T / Wt',
      value: formatPressure(result.torsionalShearStress),
      meaning: t('education.combined.meanings.torsionalShearStress'),
      warn: false,
    },
    {
      key: 'vonMisesStress',
      label: t('education.combined.rows.vonMisesStress'),
      expression: 'σe = √(σmax² + 3τT²)',
      value: formatPressure(result.vonMisesStress),
      meaning: t('education.combined.meanings.vonMisesStress'),
      warn: result.utilization > 1,
    },
    {
      key: 'safetyFactor',
      label: t('education.combined.rows.safetyFactor'),
      expression: 'n = fy / σe',
      value: `${formatScientificNumber(result.safetyFactor)}x`,
      meaning: t('education.combined.meanings.safetyFactor'),
      warn: result.safetyFactor < 1,
    },
    {
      key: 'axialDeformation',
      label: t('education.combined.rows.axialDeformation'),
      expression: 'ΔL = NL / EA',
      value: formatLength(result.axialDeformation),
      meaning: t('education.combined.meanings.axialDeformation'),
      warn: false,
    },
    {
      key: 'axialStrain',
      label: t('education.combined.rows.axialStrain'),
      expression: 'ε = σN / E',
      value: formatStrain(result.axialStrain),
      meaning: t('education.combined.meanings.axialStrain'),
      warn: false,
    },
    {
      key: 'bendingCurvature',
      label: t('education.combined.rows.bendingCurvature'),
      expression: 'κ = M / EI',
      value: formatCurvature(result.bendingCurvature),
      meaning: t('education.combined.meanings.bendingCurvature'),
      warn: false,
    },
    {
      key: 'twistAngle',
      label: t('education.combined.rows.twistAngle'),
      expression: 'φ = TL / GJ',
      value: formatAngle(result.twistAngle, result.twistAngleDeg),
      meaning: t('education.combined.meanings.twistAngle'),
      warn: false,
    },
  ];
});

const focusElement = (label: string) => {
  projectStore.clearSelection2();
  projectStore.selection2.elements = [label];
  projectStore.selection.label = label;
  projectStore.selection.type = 'element';
};
</script>
