import { createApp } from 'vue'

import './assets/styles/main.css'

import App from './App.vue'
import { initData } from './data/container'
import { registerPlugins } from './plugins'

// Escolhe memória ou Firebase e espera a sessão inicial antes de montar,
// para as guardas de rota já saberem se há usuário logado (sem "piscar" o login).
initData()
  .catch((error) => console.error('[app] falha ao iniciar os dados', error))
  .finally(() => {
    const app = createApp(App)
    registerPlugins(app)
    app.mount('#app')
  })
