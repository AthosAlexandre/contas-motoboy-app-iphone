# 🤖 IA — Leitura de prints/fotos e ficha da moto

Como o app transforma imagem em dados. Implementação em `src/data/ai`, atrás da interface
`ReceiptExtractor` (`src/domain/ports`) — as telas não sabem qual IA está por trás. Decisão em ADR-0006.

> Planejado para a **Sprint 5**. Situação verificada em 2026-09-15 — **reconferir modelos e
> limites antes de implementar**, porque mudam rápido.

## Stack
- **Firebase AI Logic** (`firebase/ai`, SDK Web) com provedor **Gemini Developer API** (free tier, plano Spark).
- Modelo lido do **Remote Config** (`ai_model`).
  - Padrão: `gemini-3.5-flash-lite` (barato/rápido, aceita imagem, free tier).
  - Alternativa: `gemini-3.8-flash` (mais preciso, free tier).
  - ❌ `gemini-1.5-flash` (sugerido na conversa inicial) está **desligado**; família 2.5 desliga em outubro/2026.
- **App Check** obrigatório a partir de **02/11/2026**.

## Tipos de leitura

| `kind` | Entrada | Saída esperada |
|--------|---------|----------------|
| `earningsScreenshot` | Print da tela de ganhos (iFood, 99Food) | plataforma, período (dia/corrida), valor total, nº de entregas, gorjetas |
| `dashboard` | Foto do painel da moto | odômetro (km), nível de combustível aproximado |
| `fuelReceipt` | Foto do cupom do posto **ou do visor da bomba** | **combustível (gasolina/etanol)**, **valor total**, **litros**, preço/litro, data |
| `motorcycleSpecs` | Marca + modelo + ano (texto, **com pesquisa na internet**) | consumo km/l, tanque, combustível, plano de manutenção, fontes |

## Saída estruturada
Pedimos **JSON com schema** (não texto livre), para mapear direto para o `Domain`. Rascunho
para `earningsScreenshot`:

```json
{
  "platform": "ifood | 99food | other",
  "periodType": "day | week | single_delivery",
  "date": "2026-09-15",
  "totalAmount": "145,90",
  "deliveriesCount": 12,
  "tips": "10,00",
  "confidence": "high | medium | low",
  "notes": "texto curto se algo estiver ilegível"
}
```
- Valores como **string** e convertidos por um único parser para centavos (ADR-0007) — evita a
  IA arredondar ou trocar vírgula por ponto.
- Campo ilegível → `null` + `confidence: low` → campo destacado na tela de confirmação.

Rascunho para `fuelReceipt`:

```json
{
  "fuelType": "gasoline | ethanol | null",
  "fuelDescription": "ETANOL HIDRATADO COMUM",
  "totalAmount": "35,00",
  "liters": "8,437",
  "pricePerLiter": "4,148",
  "date": "2026-09-15",
  "confidence": "high | medium | low"
}
```
- "GASOLINA C COMUM / ADITIVADA / PREMIUM" → `gasoline`; "ETANOL HIDRATADO / ÁLCOOL" → `ethanol`.
- **Visor da bomba** costuma mostrar total, litros e preço, mas nem sempre o combustível →
  `fuelType: null` e o usuário escolhe na confirmação (pré-selecionado com o último usado).
- Validação no app: `litros × preço ≈ total` (tolerância R$ 0,05); não bateu → destacar.
- Diesel/GNV → não suportado, avisar.

## Regras de produto
- A IA **nunca salva direto**: sempre passa pela tela **Confirmar leitura**, com campos editáveis.
- Falhou (erro, sem internet, cota, `ai_enabled=false`) → abre o formulário manual vazio com aviso.
- Salvamos a leitura em `aiExtractions` (JSON + modelo + status) — ver [firebase/](../firebase/README.md).
- A imagem **não é guardada** (ADR-0005). Redimensionar no `canvas` antes de enviar (lado maior ~1600 px, JPEG)
  para economizar tokens e dados móveis.

## Ficha da moto (pesquisa na internet — ADR-0008)
Usada quando o usuário cadastra ou troca de moto. Implementa `MotorcycleSpecsProvider` (`src/domain/ports`).

- Ferramenta **Grounding with Google Search**, suportada no AI Logic pelos modelos 3.x Flash e Flash-Lite:
  ```ts
  import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

  const ai = getAI(app, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, { model: modelName, tools: [{ googleSearch: {} }] })
  ```
- Fluxo:
  1. Prompt com marca/modelo/ano pedindo: se é flex, consumo médio **em uso urbano com gasolina e com etanol**, tanque e
     plano de manutenção do fabricante (intervalos em km e meses).
  2. Resposta + `groundingMetadata` (fontes e sugestões de busca).
  3. Converter para JSON com o schema abaixo. Se o modelo não aceitar schema junto com a
     ferramenta, fazer uma 2ª chamada **sem** ferramenta só para estruturar. **Validar na Sprint 5.**
  4. Tela **Ficha sugerida**: valores editáveis + fontes + aviso "consumo de fabricante costuma ser
     melhor que no dia a dia de entrega".
- Schema (rascunho):
  ```json
  {
    "brand": "Honda", "model": "CG 160 Fan", "year": 2024,
    "engineCc": 162,
    "fuelSupport": "flex | gasoline",
    "kmPerLiterGasoline": "40,0",
    "kmPerLiterEthanol": "28,0",
    "tankLiters": "14,0",
    "maintenance": [
      { "item": "oil_change", "intervalKm": 1000, "intervalMonths": 6 },
      { "item": "chain_kit", "intervalKm": 20000, "intervalMonths": null }
    ],
    "confidence": "high | medium | low"
  }
  ```
- **Obrigações dos termos do Google** ao usar Grounding:
  - Exibir as **sugestões de busca** (`searchEntryPoint.renderedContent`, HTML/CSS → `iframe` `srcdoc` isolado, `McSearchSuggestions`).
  - Exibir as **fontes** (`groundingChunks`) com link.
- **Cota:** Grounding nos modelos 3.x tem cota gratuita mensal (≈ 5.000 prompts/mês segundo fontes
  de terceiros — **conferir na página oficial**). Uso esperado: poucas chamadas por mês.
- Salvar em `motorcycles` com `specsSource = ai` e as fontes; registro em `aiExtractions`
  (kind `motorcycleSpecs`).

## Plano B: OCR no navegador (Tesseract.js)
Grátis e sem internet depois de carregado, mas devolve só texto solto e é pesado (~MBs de modelo).
Candidato apenas para o **odômetro** (um número grande) se a IA estiver indisponível.

## Limites e privacidade (free tier)
- Limites de requisições por minuto/dia por modelo — conferir na página de preços do Gemini API.
- No free tier o Google pode usar os dados para melhorar produtos. Prints de ganhos não têm dado
  sensível crítico, mas avisar o usuário se virar produto.

## App Check
- Produção: **reCAPTCHA Enterprise** (`ReCaptchaEnterpriseProvider`), com o domínio da Vercel cadastrado.
- Desenvolvimento (localhost ou IP da rede): **debug token** — `self.FIREBASE_APPCHECK_DEBUG_TOKEN`
  com o valor de `VITE_APPCHECK_DEBUG_TOKEN`, token cadastrado no Console.

## Prompts
> Versionar cada prompt aqui quando for criado (texto + versão + data), para saber qual prompt
> gerou cada `aiExtraction`.

| Prompt | Versão | Data | Arquivo |
|--------|--------|------|---------|
| _(a criar na Sprint 5)_ | | | |

## Referências
- [Firebase AI Logic](https://firebase.google.com/docs/ai-logic)
- [Modelos suportados](https://firebase.google.com/docs/ai-logic/models)
- [Preços / free tier](https://firebase.google.com/docs/ai-logic/pricing)
- [Grounding with Google Search](https://firebase.google.com/docs/ai-logic/grounding-google-search)
- [Descontinuações do Gemini API](https://ai.google.dev/gemini-api/docs/deprecations)
