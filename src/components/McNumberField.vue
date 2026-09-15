<template>
  <v-text-field
    v-bind="$attrs"
    :model-value="text"
    :label="label"
    :suffix="suffix"
    :inputmode="decimals > 0 ? 'decimal' : 'numeric'"
    autocomplete="off"
    @update:model-value="onInput"
  />
</template>

<script setup lang="ts">
/**
 * Campo numérico (km, litros): aceita vírgula ou ponto e limita as casas decimais.
 * v-model em `number` (`null` = vazio ou inválido).
 */
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ label?: string; suffix?: string; decimals?: number }>(), {
  label: undefined,
  suffix: undefined,
  decimals: 0,
})

const model = defineModel<number | null>({ default: null })

const text = ref(toText(model.value))

// Valor alterado por fora (ex.: formulário limpo) → atualiza o texto.
watch(model, (value) => {
  if (parse(text.value) !== value) text.value = toText(value)
})

function toText(value: number | null): string {
  return value === null ? '' : String(value).replace('.', ',')
}

function parse(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const pattern = props.decimals > 0 ? new RegExp(`^\\d+(\\.\\d{0,${props.decimals}})?$`) : /^\d+$/
  return pattern.test(normalized) ? Number(normalized) : null
}

function onInput(value: string | null) {
  text.value = value ?? ''
  model.value = parse(text.value)
}
</script>
