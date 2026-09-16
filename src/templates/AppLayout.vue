<template>
  <div>
    <v-app-bar flat class="mc-glass border-b">
      <v-app-bar-title class="font-weight-bold">{{ title }}</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <div class="mc-page">
        <v-container class="py-4">
          <router-view />
        </v-container>
      </div>
    </v-main>

    <v-bottom-navigation grow color="primary" :height="64" class="mc-glass mc-bottom-nav border-t">
      <v-btn v-for="item in NAV_ITEMS" :key="item.to" :to="item.to" :exact="item.exact">
        <v-badge v-if="item.to === '/manutencao' && maintenance.alerts > 0" :content="maintenance.alerts" color="error">
          <v-icon :icon="item.icon" />
        </v-badge>
        <v-icon v-else :icon="item.icon" />
        <span>{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup lang="ts">
/**
 * Layout principal (mobile-first): cabeçalho com o título da tela, conteúdo e barra de navegação
 * inferior. As safe areas do iPhone (barra de gestos) são tratadas em assets/styles/main.css.
 * A aba Manutenção mostra um badge com quantos itens estão vencidos ou perto de vencer (ADR-0013).
 */
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useMaintenanceStore } from '@/stores/maintenance'

const NAV_ITEMS = [
  { to: '/', label: 'Hoje', icon: 'mdi-home-variant-outline', exact: true },
  { to: '/novo', label: 'Novo', icon: 'mdi-plus-circle-outline', exact: false },
  { to: '/resumo', label: 'Resumo', icon: 'mdi-chart-box-outline', exact: false },
  { to: '/manutencao', label: 'Manutenção', icon: 'mdi-wrench-outline', exact: false },
  { to: '/ajustes', label: 'Ajustes', icon: 'mdi-cog-outline', exact: false },
] as const

const route = useRoute()
const maintenance = useMaintenanceStore()

const title = computed(() => route.meta.title ?? 'MotoboyContas')

onMounted(() => {
  if (!maintenance.loaded) void maintenance.load()
})
</script>
