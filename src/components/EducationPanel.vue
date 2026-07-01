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
import { formatScientificNumber } from '@/utils';
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
const activeView = ref<'templates' | 'derivation' | 'critical'>('templates');

const views = [
  { id: 'templates', label: 'education.views.templates', icon: 'mdi-view-grid-plus' },
  { id: 'derivation', label: 'education.views.derivation', icon: 'mdi-format-list-numbered' },
  { id: 'critical', label: 'education.views.critical', icon: 'mdi-shield-alert-outline' },
] as const;

const derivation = computed(() => buildDerivationSummary());
const critical = computed(() =>
  analyzeCriticalSections(Number(symbolStore.scope.fy ?? 235) * 1e6, Number(symbolStore.scope.tau ?? 120) * 1e6)
);

const formatLength = (value: number) => `${formatScientificNumber(appStore.convertLength(value))} ${appStore.units.Length}`;
const formatForce = (value: number) => `${formatScientificNumber(appStore.convertForce(value))} ${appStore.units.Force}`;
const formatMoment = (value: number) => `${formatScientificNumber(appStore.convertMoment(value))} ${appStore.units.Moment}`;
const formatPressure = (value: number) =>
  `${formatScientificNumber(appStore.convertPressure(value))} ${appStore.units.Pressure}`;

const supportText = (fixed: boolean) => (fixed ? t('education.derivation.fixed') : t('education.derivation.free'));

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

const focusElement = (label: string) => {
  projectStore.clearSelection2();
  projectStore.selection2.elements = [label];
  projectStore.selection.label = label;
  projectStore.selection.type = 'element';
};
</script>
