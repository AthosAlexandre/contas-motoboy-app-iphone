/**
 * Vue Router + guardas de acesso.
 *
 * - Telas de conta (`/conta/...`) ficam no `AuthLayout` e são públicas (`meta.public`).
 * - Telas do app ficam no `AppLayout` (rota pai), para a barra inferior não recarregar ao trocar de aba.
 *
 * Guardas: sem login → Entrar · logado sem moto → Minha moto · logado tentando abrir telas de conta → Hoje.
 *
 * Meta de rota:
 *  - `title`  → título do cabeçalho do AppLayout
 *  - `public` → acessível sem login
 *
 * As páginas são carregadas de forma lazy (code-splitting por rota).
 */
import { createRouter, createWebHistory } from 'vue-router'

import { useSessionStore } from '@/stores/session'
import AppLayout from '@/templates/AppLayout.vue'
import AuthLayout from '@/templates/AuthLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ===================== CONTA (público) =====================
    {
      path: '/conta',
      component: AuthLayout,
      meta: { public: true },
      children: [
        { path: 'entrar', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
        { path: 'criar', name: 'signup', component: () => import('@/pages/auth/SignUpPage.vue') },
        { path: 'esqueci-senha', name: 'forgot-password', component: () => import('@/pages/auth/ForgotPasswordPage.vue') },
      ],
    },

    // ===================== APP (logado) =====================
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'today', component: () => import('@/pages/today/TodayPage.vue'), meta: { title: 'Hoje' } },
        { path: 'novo', name: 'entry', component: () => import('@/pages/entry/EntryPage.vue'), meta: { title: 'Novo registro' } },
        { path: 'resumo', name: 'reports', component: () => import('@/pages/reports/ReportsPage.vue'), meta: { title: 'Resumo' } },
        { path: 'manutencao', name: 'maintenance', component: () => import('@/pages/maintenance/MaintenancePage.vue'), meta: { title: 'Manutenção' } },
        { path: 'ajustes', name: 'settings', component: () => import('@/pages/settings/SettingsPage.vue'), meta: { title: 'Ajustes' } },
        { path: 'moto', name: 'motorcycle', component: () => import('@/pages/motorcycle/MotorcyclePage.vue'), meta: { title: 'Minha moto' } },
      ],
    },

    // ===================== FALLBACK =====================
    { path: '/:pathMatch(.*)*', redirect: { name: 'today' } },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()

  if (to.meta.public) {
    return session.isLoggedIn ? { name: 'today' } : true
  }

  if (!session.isLoggedIn) {
    return { name: 'login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }
  }

  await session.loadMotorcycle()
  if (!session.motorcycle && to.name !== 'motorcycle') return { name: 'motorcycle' }

  return true
})

export default router
