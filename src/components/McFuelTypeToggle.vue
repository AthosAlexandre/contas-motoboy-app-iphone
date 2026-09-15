<template>
  <v-btn-toggle v-model="model" mandatory divided variant="outlined" color="primary" rounded="lg" class="w-100">
    <v-btn value="gasoline" class="flex-grow-1" prepend-icon="mdi-gas-station">Gasolina</v-btn>
    <v-btn value="ethanol" class="flex-grow-1" prepend-icon="mdi-leaf" :disabled="!allowEthanol">Etanol</v-btn>
  </v-btn-toggle>
</template>

<script setup lang="ts">
/**
 * Escolha do combustível. Não conhece o domínio: trabalha com 'gasoline' | 'ethanol'.
 * `allowEthanol = false` para moto que não é flex.
 */
withDefaults(defineProps<{ allowEthanol?: boolean }>(), { allowEthanol: true })

const model = defineModel<'gasoline' | 'ethanol'>({ required: true })
</script>
