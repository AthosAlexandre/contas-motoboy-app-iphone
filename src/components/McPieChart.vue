<template>
  <div>
    <div v-if="total > 0" class="d-flex align-center ga-4">
      <svg class="mc-pie" viewBox="0 0 42 42" role="img" :aria-label="ariaLabel">
        <circle class="mc-pie__track" cx="21" cy="21" :r="RADIUS" fill="none" stroke-width="5" />
        <circle
          v-for="arc in arcs"
          :key="arc.key"
          cx="21"
          cy="21"
          :r="RADIUS"
          fill="none"
          stroke-width="5"
          :stroke="arc.color"
          :stroke-dasharray="`${arc.length} ${100 - arc.length}`"
          :stroke-dashoffset="arc.offset"
        />
        <text x="21" y="20.2" class="mc-pie__total" text-anchor="middle">{{ formatValue(total) }}</text>
        <text v-if="caption" x="21" y="24" class="mc-pie__caption" text-anchor="middle">{{ caption }}</text>
      </svg>

      <ul class="mc-pie__legend flex-grow-1">
        <li v-for="arc in arcs" :key="arc.key" class="d-flex align-center ga-2 text-body-2">
          <span class="mc-pie__dot" :style="{ backgroundColor: arc.color }" />
          <span class="text-truncate flex-grow-1">{{ arc.label }}</span>
          <span class="font-weight-medium">{{ formatValue(arc.value) }}</span>
          <span class="text-medium-emphasis mc-pie__percent">{{ formatPercent(arc.value / total) }}</span>
        </li>
      </ul>
    </div>

    <p v-else class="text-body-2 text-medium-emphasis mb-0">{{ emptyText }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Gráfico de rosca em SVG, sem biblioteca de gráficos (ADR-0017).
 *
 * Truque do raio: circunferência = 100, então cada fatia usa a própria porcentagem como comprimento
 * do traço (`stroke-dasharray`). O componente recebe os valores já prontos (cor e rótulo vêm da tela).
 */
import { computed } from 'vue'

import { formatPercent } from '@/lib/format'

const RADIUS = 15.915

const props = withDefaults(
  defineProps<{
    slices: { key: string; label: string; value: number; color: string }[]
    /** Formata o valor (ex.: centavos → "R$ 18,60"). */
    formatValue: (value: number) => string
    caption?: string
    emptyText?: string
  }>(),
  { caption: undefined, emptyText: 'Sem dados neste período.' },
)

const total = computed(() => props.slices.reduce((sum, slice) => sum + slice.value, 0))

const arcs = computed(() => {
  let consumed = 0
  return props.slices.map((slice) => {
    const length = total.value > 0 ? (slice.value / total.value) * 100 : 0
    // 25 gira o começo para o topo do círculo.
    const offset = 25 - consumed
    consumed += length
    return { ...slice, length, offset }
  })
})

const ariaLabel = computed(() =>
  props.slices.map((slice) => `${slice.label}: ${props.formatValue(slice.value)}`).join(', '),
)
</script>

<style scoped>
.mc-pie {
  width: 128px;
  height: 128px;
  flex: 0 0 auto;
  transform: rotate(-90deg);
}

.mc-pie__track {
  stroke: rgba(var(--v-theme-on-surface), 0.08);
}

.mc-pie__total,
.mc-pie__caption {
  transform: rotate(90deg);
  transform-origin: 21px 21px;
  fill: rgb(var(--v-theme-on-surface));
}

.mc-pie__total {
  font-size: 4.2px;
  font-weight: 700;
}

.mc-pie__caption {
  font-size: 2.8px;
  opacity: 0.7;
}

.mc-pie__legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.mc-pie__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.mc-pie__percent {
  width: 42px;
  text-align: right;
}
</style>
