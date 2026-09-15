/**
 * Vue Router.
 *
 * Todas as telas do app ficam dentro do `AppLayout` (rota pai), para a barra de navegação
 * inferior não recarregar ao trocar de aba. Login e guardas de acesso entram na Sprint 2.
 *
 * Meta de rota:
 *  - `title` → título exibido no cabeçalho do AppLayout
 *
 * As páginas são carregadas de forma lazy (code-splitting por rota).
 */
import { createRouter, createWebHistory } from 'vue-router'

import AppLayout from '@/templates/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'today', component: () => import('@/pages/today/TodayPage.vue'), meta: { title: 'Hoje' } },
        { path: 'novo', name: 'entry', component: () => import('@/pages/entry/EntryPage.vue'), meta: { title: 'Novo registro' } },
        { path: 'resumo', name: 'reports', component: () => import('@/pages/reports/ReportsPage.vue'), meta: { title: 'Resumo' } },
        { path: 'manutencao', name: 'maintenance', component: () => import('@/pages/maintenance/MaintenancePage.vue'), meta: { title: 'Manutenção' } },
        { path: 'ajustes', name: 'settings', component: () => import('@/pages/settings/SettingsPage.vue'), meta: { title: 'Ajustes' } },
      ],
    },

    // ===================== FALLBACK =====================
    { path: '/:pathMatch(.*)*', redirect: { name: 'today' } },
  ],
})

export default router
