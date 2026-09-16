<template>
  <div>
    <template v-if="points.length > 1">
      <div class="d-flex align-baseline justify-space-between text-caption text-medium-emphasis mb-1">
        <span>{{ formatValue(bounds.max) }}</span>
        <span v-if="highlight">{{ highlight }}</span>
      </div>

      <svg class="mc-line" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" role="img" :aria-label="ariaLabel">
        <line
          v-if="bounds.min < 0"
          class="mc-line__zero"
          x1="0"
          :x2="WIDTH"
          :y1="zeroY"
          :y2="zeroY"
          vector-effect="non-scaling-stroke"
        />
        <polygon class="mc-line__area" :points="areaPoints" :style="{ fill: color }" />
        <polyline
          class="mc-line__stroke"
          :points="linePoints"
          :style="{ stroke: color }"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
        <span>{{ points[0]?.label }}</span>
        <span>{{ points.at(-1)?.label }}</span>
      </div>
    </template>

    <p v-else class="text-body-2 text-medium-emphasis mb-0">{{ emptyText }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Gráfico de linha em SVG, sem biblioteca de gráficos (ADR-0017).
 * Escala vertical inclui o zero; quando há valor negativo, a linha do zero aparece tracejada.
 */
import { computed } from 'vue'

const WIDTH = 100
const HEIGHT = 40

const props = withDefaults(
  defineProps<{
    points: { label: string; value: number }[]
    /** Formata o valor (ex.: centavos → "R$ 18,60"). */
    formatValue: (value: number) => string
    color?: string
    /** Texto curto no canto (ex.: "média R$ 120,00"). */
    highlight?: string
    emptyText?: string
  }>(),
  { color: 'rgb(var(--v-theme-primary))', highlight: undefined, emptyText: 'Sem dados suficientes para o gráfico.' },
)

const bounds = computed(() => {
  const values = props.points.map((point) => point.value)
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  return { max, min, span: max - min || 1 }
})

function toY(value: number): number {
  const ratio = (value - bounds.value.min) / bounds.value.span
  // 2px de folga em cima e embaixo para a linha não encostar na borda.
  return HEIGHT - 2 - ratio * (HEIGHT - 4)
}

function toX(index: number): number {
  return props.points.length < 2 ? 0 : (index / (props.points.length - 1)) * WIDTH
}

const zeroY = computed(() => toY(0))

const linePoints = computed(() =>
  props.points.map((point, index) => `${toX(index).toFixed(2)},${toY(point.value).toFixed(2)}`).join(' '),
)

const areaPoints = computed(
  () => `0,${zeroY.value.toFixed(2)} ${linePoints.value} ${WIDTH},${zeroY.value.toFixed(2)}`,
)

const ariaLabel = computed(() =>
  props.points.map((point) => `${point.label}: ${props.formatValue(point.value)}`).join(', '),
)
</script>

<style scoped>
.mc-line {
  width: 100%;
  height: 120px;
  display: block;
}

.mc-line__stroke {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.mc-line__area {
  opacity: 0.16;
}

.mc-line__zero {
  stroke: rgba(var(--v-theme-on-surface), 0.3);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
</style>
