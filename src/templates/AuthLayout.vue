<template>
  <v-main>
    <div class="mc-auth d-flex flex-column align-center justify-center pa-4">
      <img src="/pwa-192x192.png" alt="" width="72" height="72" class="mc-auth__logo mb-3" />
      <h1 class="text-h5 font-weight-bold mb-1">MotoboyContas</h1>
      <p class="text-body-2 text-medium-emphasis text-center mb-6">
        Ganhos, combustível e manutenção — o lucro real do seu dia.
      </p>

      <v-card flat class="border pa-5 w-100" max-width="420">
        <router-view />
      </v-card>
    </div>
  </v-main>
</template>

<script setup lang="ts">
/**
 * Layout das telas de conta (entrar, criar conta, esqueci a senha): marca + card centralizado.
 */
</script>

<style scoped>
.mc-auth {
  min-height: 100dvh;
  padding-bottom: calc(16px + var(--mc-safe-bottom)) !important;
}

.mc-auth__logo {
  border-radius: 18px;
}
</style>
