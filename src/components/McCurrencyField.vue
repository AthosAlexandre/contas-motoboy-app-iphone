<template>
  <v-text-field
    v-bind="$attrs"
    :model-value="display"
    :label="label"
    prefix="R$"
    inputmode="numeric"
    autocomplete="off"
    @update:model-value="onInput"
  />
</template>

<script setup lang="ts">
/**
 * Campo de dinheiro no estilo app de banco: só números, e os centavos vão se formando
 * (digitar 1-4-5-9-0 → 145,90). v-model em centavos inteiros (`null` = vazio).
 */
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ label?: string; maxCents?: number }>(), {
  label: undefined,
  maxCents: 99_999_999,
})

const cents = defineModel<number | null>({ default: null })

const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const display = computed(() => (cents.value === null ? '' : formatter.format(cents.value / 100)))

function onInput(text: string | null) {
  const digits = (text ?? '').replace(/\D/g, '')
  cents.value = digits ? Math.min(Number(digits), props.maxCents) : null
}
</script>
