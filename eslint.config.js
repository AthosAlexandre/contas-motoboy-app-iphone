import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

/**
 * Regra de camadas (ADR-0012 / docs/ARQUITETURA.md).
 * Imports entre camadas usam sempre o alias `@/`, e cada camada tem uma lista do que NÃO pode importar.
 */
const VUE_LIBS = '^(vue|vue-router|pinia|vuetify)(/|$)'
const FIREBASE = '^firebase(/|$)'

function forbid(...patterns) {
  return { 'no-restricted-imports': ['error', { patterns }] }
}

export default defineConfigWithVueTs(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,vue}'] },
  { name: 'app/files-to-ignore', ignores: ['dist/**', 'dev-dist/**', 'coverage/**', 'public/**'] },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'layers/domain',
    files: ['src/domain/**'],
    rules: {
      ...forbid(
        { regex: VUE_LIBS, message: 'domain é TypeScript puro: sem Vue/Vuetify/Pinia (ADR-0012).' },
        { regex: FIREBASE, message: 'domain não conhece o Firebase — use uma interface em domain/ports.' },
        { regex: '^@/(?!domain/)', message: 'domain não importa outras camadas do app.' },
      ),
      // domain será reaproveitado no app de loja (Expo): nada de APIs de navegador.
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'indexedDB'],
    },
  },
  {
    name: 'layers/data',
    files: ['src/data/**'],
    rules: forbid(
      { regex: VUE_LIBS, message: 'data não depende de Vue.' },
      { regex: '^@/(actions|stores|hooks|components|pages|templates|routes|plugins)/', message: 'data só importa domain e services.' },
    ),
  },
  {
    name: 'layers/services',
    files: ['src/services/**'],
    rules: forbid({ regex: '^@/', message: 'services só inicializa SDKs; não importa o app.' }),
  },
  {
    name: 'layers/actions',
    files: ['src/actions/**'],
    rules: forbid(
      { regex: VUE_LIBS, message: 'actions (casos de uso) não dependem de Vue.' },
      { regex: FIREBASE, message: 'actions usam os repositórios de data/container, não o Firebase direto.' },
      { regex: '^@/(services|stores|hooks|components|pages|templates|routes|plugins)/', message: 'actions só importam domain e data.' },
    ),
  },
  {
    name: 'layers/ui-state',
    files: ['src/stores/**', 'src/hooks/**'],
    rules: forbid(
      { regex: FIREBASE, message: 'stores/hooks não falam com o Firebase — chame uma action.' },
      { regex: '^@/(services|data)/', message: 'stores/hooks não acessam services/data — chame uma action.' },
    ),
  },
  {
    name: 'layers/components',
    files: ['src/components/**'],
    rules: forbid(
      { regex: FIREBASE, message: 'Componentes Mc* são só apresentação.' },
      { regex: '^@/(domain|data|actions|services|stores|hooks|pages)/', message: 'Componentes Mc* recebem props simples e emitem eventos.' },
    ),
  },
  {
    name: 'layers/pages',
    files: ['src/pages/**', 'src/templates/**'],
    rules: forbid(
      { regex: FIREBASE, message: 'Page não fala com o Firebase — use hooks/stores/actions.' },
      { regex: '^@/(services|data)/', message: 'Page não acessa services/data — use hooks/stores/actions.' },
    ),
  },
)
