/**
 * Configuração do Vuetify — identidade do MotoboyContas.
 *
 * Paleta azul-aqua em tons pastéis. No tema claro o `primary` é um aqua mais fechado (texto legível
 * sobre branco, contraste ≥ 4,5) e os pastéis ficam nos fundos/tonais; no escuro os próprios pastéis
 * são as cores de destaque. Cores com significado: aqua = ações/dinheiro (primary), âmbar suave =
 * combustível (fuel), lavanda-azul = manutenção (maintenance).
 * Temas `light` e `dark` com `defaultTheme: 'system'` (segue o modo claro/escuro do celular).
 *
 * Componentes Mc* consomem estes tokens (color="primary" / "fuel"), nunca hex hardcoded.
 */
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { pt } from 'vuetify/locale'

const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F3F8FA', // branco levemente aqua
    surface: '#FFFFFF',
    'surface-variant': '#DDECF2', // aqua pastel (chips, fundos de destaque)
    'on-surface-variant': '#48606B',

    primary: '#157499', // azul-aqua — ações principais, dinheiro
    secondary: '#3F6FBF', // azul pastel mais fechado
    aqua: '#8FD3E8', // aqua pastel — detalhes e gráficos
    fuel: '#9A6412', // âmbar suave — combustível
    maintenance: '#5B63C9', // lavanda-azul — manutenção

    error: '#C94A55',
    warning: '#9A6412',
    success: '#2E8F76', // verde-água (combina com o aqua)
    info: '#3F6FBF',

    'on-primary': '#FFFFFF',
    'on-fuel': '#FFFFFF',
    'on-maintenance': '#FFFFFF',
  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0C1419', // azul-petróleo quase preto
    surface: '#131E25',
    'surface-variant': '#223440',
    'on-surface-variant': '#AFC4CE',

    primary: '#7FD1E6', // aqua pastel
    secondary: '#9DB8F2', // azul pastel
    aqua: '#BDEBF5',
    fuel: '#F2C27B', // âmbar pastel
    maintenance: '#AFB6F5', // lavanda pastel

    error: '#F29CA3',
    warning: '#F2C27B',
    success: '#86D9BE',
    info: '#8EC5F0',

    'on-primary': '#062A36',
    'on-fuel': '#2B1A00',
    'on-maintenance': '#141A4A',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: { light, dark },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  locale: {
    locale: 'pt',
    messages: { pt },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      style: 'letter-spacing: 0; text-transform: none;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
  },
})
