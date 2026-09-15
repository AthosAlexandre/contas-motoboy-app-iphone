import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

// Testes de regras de negócio (src/domain) e casos de uso (src/actions): rodam no Node, sem navegador.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
  },
})
