<template>
  <div>
    <v-btn-toggle
      :model-value="kind"
      mandatory
      divided
      variant="outlined"
      color="primary"
      rounded="lg"
      class="w-100"
      @update:model-value="$emit('update:kind', $event as Kind)"
    >
      <v-btn value="day" class="flex-grow-1">Dia</v-btn>
      <v-btn value="week" class="flex-grow-1">Semana</v-btn>
      <v-btn value="month" class="flex-grow-1">Mês</v-btn>
    </v-btn-toggle>

    <div class="d-flex align-center justify-space-between mt-2">
      <v-btn icon="mdi-chevron-left" variant="text" aria-label="Período anterior" @click="$emit('previous')" />

      <div class="text-center">
        <div class="text-subtitle-1 font-weight-bold">{{ label }}</div>
        <v-btn v-if="!isCurrent" size="x-small" variant="text" color="primary" @click="$emit('now')">
          Voltar para hoje
        </v-btn>
      </div>

      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        aria-label="Próximo período"
        :disabled="isCurrent"
        @click="$emit('next')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Seletor de período do Resumo: Dia | Semana | Mês, com navegação ‹ › e atalho para voltar ao atual.
 * Não avança para o futuro (`isCurrent` desabilita a seta da direita).
 */
type Kind = 'day' | 'week' | 'month'

defineProps<{
  kind: Kind
  /** Texto do período já formatado (ex.: "15/09", "14 a 20/09", "Setembro de 2026"). */
  label: string
  isCurrent: boolean
}>()

defineEmits<{
  'update:kind': [kind: Kind]
  previous: []
  next: []
  now: []
}>()
</script>
