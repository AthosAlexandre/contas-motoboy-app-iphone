<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
// Shell do app. Cada layout (templates/) traz sua própria estrutura (app-bar, v-main, navegação);
// por isso o App NÃO embrulha num v-main.
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()

// Sessão caiu (saiu em outra aba, token expirou) → volta para o login.
watch(
  () => session.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && !route.meta.public) void router.replace({ name: 'login' })
  },
)
</script>
