<template>
  <v-form @submit.prevent="onSubmit">
    <h2 class="text-h6 mb-4">Criar conta</h2>

    <v-btn block size="large" variant="outlined" prepend-icon="mdi-google" :loading="google.loading.value" @click="onGoogle">
      Criar conta com Google
    </v-btn>

    <div class="d-flex align-center ga-3 my-4 text-caption text-medium-emphasis">
      <v-divider />
      ou
      <v-divider />
    </div>

    <v-text-field v-model="name" label="Seu nome" autocomplete="name" autocapitalize="words" prepend-inner-icon="mdi-account-outline" />
    <v-text-field
      v-model="email"
      label="E-mail"
      type="email"
      inputmode="email"
      autocomplete="email"
      autocapitalize="off"
      prepend-inner-icon="mdi-email-outline"
    />
    <McPasswordField
      v-model="password"
      autocomplete="new-password"
      prepend-inner-icon="mdi-lock-outline"
      hint="Pelo menos 6 caracteres"
      persistent-hint
    />

    <v-alert v-if="shownError" class="my-4" type="error" variant="tonal" density="compact" :text="shownError" />

    <v-btn type="submit" block size="large" color="primary" class="mt-4" :loading="form.loading.value">Criar conta</v-btn>

    <div class="text-center mt-4 text-body-2">
      Já tem conta? <router-link :to="{ name: 'login' }" class="text-primary">Entrar</router-link>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import McPasswordField from '@/components/McPasswordField.vue'
import { useFormSubmit } from '@/hooks/useFormSubmit'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const form = useFormSubmit()
const google = useFormSubmit()

const name = ref('')
const email = ref('')
const password = ref('')

const shownError = computed(() => form.error.value ?? google.error.value)

// Conta nova ainda não tem moto: depois de entrar, a guarda leva para "Minha moto".
async function onSubmit() {
  google.error.value = null
  const ok = await form.submit(() => session.signUp(name.value, email.value, password.value))
  if (ok) await router.replace({ name: 'today' })
}

async function onGoogle() {
  form.error.value = null
  const ok = await google.submit(() => session.signInWithGoogle())
  if (ok) await router.replace({ name: 'today' })
}
</script>
