/**
 * Registro central de plugins do app.
 * Ordem importa: Pinia antes do Router (as guardas de rota vão usar stores).
 */
import type { App } from 'vue'
import { createPinia } from 'pinia'

import vuetify from './vuetify'
import router from '@/routes'

export function registerPlugins(app: App) {
  app.use(createPinia()).use(router).use(vuetify)
}
