<template>
  <v-alert :type="type" variant="tonal" density="comfortable" :title="title" :text="text">
    <template v-if="actionLabel" #append>
      <v-btn size="small" variant="text" :to="to" @click="$emit('action')">{{ actionLabel }}</v-btn>
    </template>
  </v-alert>
</template>

<script setup lang="ts">
/**
 * Aviso dentro do app (ADR-0013 — não usamos notificação push): manutenção vencendo, turno em aberto…
 * Com `to`, o botão leva para uma rota; sem `to`, emite `action`.
 */
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    title: string
    text: string
    type?: 'info' | 'warning' | 'error' | 'success'
    actionLabel?: string
    to?: RouteLocationRaw
  }>(),
  { type: 'warning', actionLabel: undefined, to: undefined },
)

defineEmits<{ action: [] }>()
</script>
