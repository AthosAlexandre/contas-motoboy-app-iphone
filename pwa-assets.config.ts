import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os ícones do PWA em public/ a partir do favicon.svg (`npm run icons`).
// O SVG já é "full-bleed" (fundo até a borda, desenho dentro da área segura),
// então o ícone do iPhone e o maskable do Android não recebem margem extra.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/favicon.svg'],
})
