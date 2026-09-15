<template>
  <v-text-field
    v-bind="$attrs"
    v-model="model"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :append-inner-icon="visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
    autocapitalize="off"
    spellcheck="false"
    @click:append-inner="visible = !visible"
  />
</template>

<script setup lang="ts">
/**
 * Campo de senha com botão de mostrar/ocultar (sem repetir o estado em cada tela).
 * `autocomplete="new-password"` no cadastro faz o iPhone sugerir uma senha forte.
 */
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{ label?: string; autocomplete?: 'current-password' | 'new-password' }>(), {
  label: 'Senha',
  autocomplete: 'current-password',
})

const model = defineModel<string>({ default: '' })

const visible = ref(false)
</script>
