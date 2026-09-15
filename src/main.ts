import { createApp } from 'vue'

import './assets/styles/main.css'

import App from './App.vue'
import { registerPlugins } from './plugins'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
