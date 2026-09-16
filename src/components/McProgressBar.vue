<template>
  <div>
    <div class="d-flex align-baseline justify-space-between mb-1">
      <span class="text-body-2">{{ label }}</span>
      <span class="text-caption" :class="`text-${color}`">{{ hint }}</span>
    </div>
    <v-progress-linear :model-value="percent" :color="color" height="8" rounded bg-opacity="0.15" />
  </div>
</template>

<script setup lang="ts">
/**
 * Barra de progresso com faixas: em dia (primary), atenção (warning) e vencido (error).
 * Recebe o progresso pronto (0 a 1+); acima de 1 a barra fica cheia e vermelha.
 */
import { computed } from 'vue'

const props = defineProps<{
  label: string
  /** 0 = acabou de trocar · 1 = chegou no intervalo · >1 = passou. */
  ratio: number
  /** Texto curto à direita: "faltam 300 km", "vencido há 100 km". */
  hint: string
  state: 'ok' | 'warning' | 'overdue'
}>()

const percent = computed(() => Math.min(100, Math.max(0, props.ratio * 100)))

const color = computed(() => (props.state === 'overdue' ? 'error' : props.state === 'warning' ? 'warning' : 'primary'))
</script>
