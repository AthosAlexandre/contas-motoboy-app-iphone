<template>
  <v-form @submit.prevent="onSubmit">
    <h2 class="text-h6 mb-4">Entrar</h2>

    <v-alert
      v-if="session.isLocalMode"
      class="mb-4"
      type="info"
      variant="tonal"
      density="compact"
      text="Modo local: qualquer e-mail entra e os dados ficam só neste aparelho."
    />

    <v-btn block size="large" variant="outlined" prepend-icon="mdi-google" :loading="google.loading.value" @click="onGoogle">
      Continuar com Google
    </v-btn>

    <div class="d-flex align-center ga-3 my-4 text-caption text-medium-emphasis">
      <v-divider />
      ou
      <v-divider />
    </div>

    <v-text-field
      v-model="email"
      label="E-mail"
      type="email"
      inputmode="email"
      autocomplete="email"
      autocapitalize="off"
      prepend-inner-icon="mdi-email-outline"
    />
    <McPasswordField v-model="password" prepend-inner-icon="mdi-lock-outline" />

    <v-alert v-if="shownError" class="mb-4" type="error" variant="tonal" density="compact" :text="shownError" />

    <v-btn type="submit" block size="large" color="primary" :loading="form.loading.value">Entrar</v-btn>

    <div class="d-flex justify-space-between mt-4 text-body-2">
      <router-link :to="{ name: 'forgot-password' }" class="text-primary">Esqueci a senha</router-link>
      <router-link :to="{ name: 'signup' }" class="text-primary">Criar conta</router-link>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { googleRedirectError } from '@/actions/auth'
import McPasswordField from '@/components/McPasswordField.vue'
import { useFormSubmit } from '@/hooks/useFormSubmit'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const form = useFormSubmit()
const google = useFormSubmit()

const email = ref('')
const password = ref('')

const shownError = computed(() => form.error.value ?? google.error.value)

// Voltou do Google com erro (ex.: e-mail já cadastrado com senha)?
onMounted(async () => {
  google.error.value = await googleRedirectError()
})

/** Só aceita caminhos internos (evita redirecionar para outro site). */
function redirectTarget(): string {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}

async function onSubmit() {
  google.error.value = null
  const ok = await form.submit(() => session.signIn(email.value, password.value))
  if (ok) await router.replace(redirectTarget())
}

async function onGoogle() {
  form.error.value = null
  const ok = await google.submit(() => session.signInWithGoogle())
  if (ok) await router.replace(redirectTarget())
}
</script>
