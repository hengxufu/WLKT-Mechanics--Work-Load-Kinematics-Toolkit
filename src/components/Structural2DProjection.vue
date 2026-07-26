<script setup lang="ts">
import { computed } from 'vue';
import { useStructuralStore } from '@/store/structural';
import { useWorkspaceStore } from '@/store/workspace';
import type { StructuralNode } from '@/types/structuralAnalysis';

defineProps<{ id: string }>();

const structuralStore = useStructuralStore();
const workspaceStore = useWorkspaceStore();

const WIDTH = 1000;
const HEIGHT = 700;
const PADDING = 70;

const projectNode = (node: StructuralNode) => {
  if (workspaceStore.activeWorkPlane === 'xz') return { u: node.x, v: node.z };
  if (workspaceStore.activeWorkPlane === 'yz') return { u: node.y, v: node.z };
  return { u: node.x, v: node.y };
};

const bounds = computed(() => {
  const points = structuralStore.model.nodes.map(projectNode);
  if (points.length === 0) return { minU: 0, maxU: 1, minV: 0, maxV: 1 };
  const valuesU = points.map((point) => point.u);
  const valuesV = points.map((point) => point.v);
  const minU = Math.min(...valuesU);
  const maxU = Math.max(...valuesU);
  const minV = Math.min(...valuesV);
  const maxV = Math.max(...valuesV);
  return {
    minU,
    maxU: maxU === minU ? minU + 1 : maxU,
    minV,
    maxV: maxV === minV ? minV + 1 : maxV,
  };
});

const scale = computed(() => {
  const widthScale = (WIDTH - PADDING * 2) / (bounds.value.maxU - bounds.value.minU);
  const heightScale = (HEIGHT - PADDING * 2) / (bounds.value.maxV - bounds.value.minV);
  return Math.min(widthScale, heightScale);
});

const screenPoint = (node: StructuralNode) => {
  const point = projectNode(node);
  const modelWidth = (bounds.value.maxU - bounds.value.minU) * scale.value;
  const modelHeight = (bounds.value.maxV - bounds.value.minV) * scale.value;
  const offsetX = (WIDTH - modelWidth) / 2;
  const offsetY = (HEIGHT - modelHeight) / 2;
  return {
    x: offsetX + (point.u - bounds.value.minU) * scale.value,
    y: HEIGHT - offsetY - (point.v - bounds.value.minV) * scale.value,
  };
};

const nodeById = computed(() => new Map(structuralStore.model.nodes.map((node) => [node.id, node])));
const members = computed(() =>
  structuralStore.model.members.flatMap((member) => {
    const start = member.startNodeId ? nodeById.value.get(member.startNodeId) : undefined;
    const end = member.endNodeId ? nodeById.value.get(member.endNodeId) : undefined;
    return start && end ? [{ member, start: screenPoint(start), end: screenPoint(end) }] : [];
  })
);
const nodes = computed(() =>
  structuralStore.model.nodes.map((node) => ({ node, point: screenPoint(node) }))
);

const selectNode = (id: string) => {
  structuralStore.selectedNodeId = id;
  structuralStore.selectedMemberId = null;
};

const selectMember = (id: string) => {
  structuralStore.selectedMemberId = id;
  structuralStore.selectedNodeId = null;
};
</script>

<template>
  <div class="projection-view">
    <svg
      v-if="structuralStore.model.nodes.length > 0"
      :id="id"
      class="projection-view__svg"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="img"
      :aria-label="`${workspaceStore.activeWorkPlane.toUpperCase()} 平面投影`"
    >
      <defs>
        <pattern id="projection-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d8e4f0" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#projection-grid)" />

      <g class="projection-view__members">
        <line
          v-for="{ member, start, end } in members"
          :key="member.id"
          :x1="start.x"
          :y1="start.y"
          :x2="end.x"
          :y2="end.y"
          :class="{ selected: structuralStore.selectedMemberId === member.id }"
          tabindex="0"
          role="button"
          :aria-label="`构件 ${member.id}`"
          @click="selectMember(member.id)"
          @keydown.enter="selectMember(member.id)"
        />
      </g>

      <g
        v-for="{ node, point } in nodes"
        :key="node.id"
        class="projection-view__node"
        :class="{ selected: structuralStore.selectedNodeId === node.id }"
        tabindex="0"
        role="button"
        :aria-label="`节点 ${node.id}`"
        @click="selectNode(node.id)"
        @keydown.enter="selectNode(node.id)"
        @keydown.space.prevent="selectNode(node.id)"
      >
        <circle class="hit-target" :cx="point.x" :cy="point.y" r="24" />
        <rect
          v-if="Object.values(node.constraints).some(Boolean)"
          :x="point.x - 12"
          :y="point.y + 10"
          width="24"
          height="9"
          rx="1"
        />
        <circle class="node-marker" :cx="point.x" :cy="point.y" r="8" />
        <text :x="point.x + 12" :y="point.y - 12">{{ node.id }}</text>
      </g>
    </svg>

    <div v-else class="projection-view__empty">
      <v-icon icon="mdi-vector-polyline" size="36" />
      <span>当前三维模型为空</span>
    </div>

    <div class="projection-view__status">
      {{ workspaceStore.activeWorkPlane.toUpperCase() }} 投影
      <span>节点 {{ structuralStore.model.nodes.length }}</span>
      <span>构件 {{ structuralStore.model.members.length }}</span>
    </div>
  </div>
</template>

<style scoped>
.projection-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  background: #f7fafc;
}

.projection-view__svg { width: 100%; height: 100%; display: block; }
.projection-view__members line {
  stroke: #243d5c;
  stroke-width: 7;
  stroke-linecap: round;
  cursor: pointer;
}
.projection-view__members line.selected { stroke: #0068b7; stroke-width: 11; }
.projection-view__node { cursor: pointer; outline: none; }
.projection-view__node .hit-target { fill: transparent; stroke: transparent; pointer-events: all; }
.projection-view__node .node-marker { fill: #fff; stroke: #003b7a; stroke-width: 4; }
.projection-view__node rect { fill: #fdb714; stroke: #7a5600; stroke-width: 2; }
.projection-view__node text { fill: #17375e; font-size: 22px; font-weight: 700; }
.projection-view__node.selected .node-marker { fill: #fdb714; stroke: #005da8; stroke-width: 6; }

.projection-view__empty {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  transform: translate(-50%, -50%);
  color: #52677f;
  font-size: 13px;
}

.projection-view__status {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 18px;
  padding: 5px 12px;
  background: rgba(11, 32, 64, 0.9);
  color: #fff;
  font-size: 12px;
}
</style>
