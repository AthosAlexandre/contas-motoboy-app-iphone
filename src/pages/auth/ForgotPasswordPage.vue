<template>
  <v-form @submit.prevent="onSubmit">
    <h2 class="text-h6 mb-2">Esqueci a senha</h2>

    <template v-if="sent">
      <v-alert
        type="success"
        variant="tonal"
        text="Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha. Confira também a caixa de spam."
      />
    </template>

    <template v-else>
      <p class="text-body-2 text-medium-emphasis mb-4">Informe o e-mail da conta e enviaremos um link para criar uma nova senha.</p>
      <v-text-field
        v-model="email"
        label="E-mail"
        type="email"
        inputmode="email"
        autocomplete="email"
        autocapitalize="off"
        prepend-inner-icon="mdi-email-outline"
      />
      <v-alert v-if="error" class="mb-4" type="error" variant="tonal" density="compact" :text="error" />
      <v-btn type="submit" block size="large" color="primary" :loading="loading">Enviar link</v-btn>
    </template>

    <div class="text-center mt-4 text-body-2">
      <router-link :to="{ name: 'login' }" class="text-primary">Voltar para entrar</router-link>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { sendPasswordReset } from '@/actions/auth'
import { useFormSubmit } from '@/hooks/useFormSubmit'

const { loading, error, submit } = useFormSubmit()

const email = ref('')
const sent = ref(false)

async function onSubmit() {
  sent.value = await submit(() => sendPasswordReset(email.value))
}
</script>
