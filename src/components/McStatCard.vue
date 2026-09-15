<template>
  <v-card
    :color="highlight ? color : undefined"
    :variant="highlight ? 'tonal' : 'flat'"
    :class="['pa-4 h-100', { border: !highlight }]"
  >
    <div class="d-flex align-center ga-2 text-body-2" :class="highlight ? '' : 'text-medium-emphasis'">
      <v-icon v-if="icon" :icon="icon" size="18" :color="highlight ? undefined : color" />
      <span>{{ title }}</span>
    </div>
    <div :class="['font-weight-bold mt-1', highlight ? 'text-h5' : 'text-h6']">{{ value }}</div>
    <div v-if="caption || $slots.caption" class="text-caption text-medium-emphasis mt-1">
      <slot name="caption">{{ caption }}</slot>
    </div>
  </v-card>
</template>

<script setup lang="ts">
/**
 * Card de número: título, valor já formatado e legenda opcional.
 * `highlight` = card tonal na cor informada (destaque da tela).
 */
withDefaults(
  defineProps<{
    title: string
    value: string
    caption?: string
    icon?: string
    color?: string
    highlight?: boolean
  }>(),
  { caption: undefined, icon: undefined, color: 'primary', highlight: false },
)
</script>
