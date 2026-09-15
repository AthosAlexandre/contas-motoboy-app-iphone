# Diário de Desenvolvimento — MotoboyContas

Registro do que foi feito, quando e por quê. Ordem cronológica (mais recente no topo).

---

## 2026-09-15 — Sprint 1: turno, lançamentos e cálculos (entrada manual)

**Feito:**
- **domain:** entidades (`Shift`, `Earning`, `Expense`, `Fueling`, `Motorcycle`, `Platform`, `Settings`),
  `DomainError` com mensagens prontas, `period.ts` (dia em São Paulo, semana seg–dom, mês).
- **Calculadoras:** consumo medido por combustível (tanque cheio, ignora tanque misturado, média
  ponderada dos 3 últimos intervalos); snapshot do turno (combustível do último abastecimento;
  consumo medido → ficha; preço do último abastecimento → padrão; reserva por 100 km até existirem
  itens); resumo do período (lucro operacional/líquido, R$/km, quanto guardar, modo estimado × real);
  reserva por itens de manutenção.
- **data:** repositórios locais (`data/memory`) salvos no aparelho via localStorage, com seed (iFood,
  99Food, moto de exemplo flex 40/28 km/l, gasolina R$ 6,20, etanol R$ 4,15, reserva R$ 8,42/100 km).
- **actions:** `startShift`, `endShift` (snapshot), `addEarning` (liga ao turno aberto), `addExpense`,
  `addFueling` (preço/litro calculado; etanol só em moto flex), `listEntries`, `removeEntry`,
  `getPeriodSummary`, `getFuelContext`.
- **UI:** `lib/format`, `hooks/useAsyncAction`, `stores/today`; componentes `McCurrencyField` (estilo app
  de banco), `McNumberField`, `McFuelTypeToggle`, `McStatCard`; telas **Hoje** e **Novo registro**.
- Docs: componentes (4 docs), fluxos `hoje.md` e `novo-registro.md`, REGRAS, ARQUITETURA, SETUP.

**Verificação:** 85 testes — inclui o fluxo completo de um dia com os números da REGRAS (R$ 180 de
ganho → guardar R$ 28,70) —, type-check, lint (camadas) e build sem erros.
**As telas não foram abertas num navegador nesta sessão** — falta usar de verdade.

**Decisões pequenas:**
- Modo local persiste no aparelho (localStorage) para a Sprint 1 já ser usável no iPhone.
- Ids gerados sem `crypto.randomUUID` (indisponível em `http://IP` da rede local).
- Categorias de gasto sem combustível e manutenção (entram por abastecimento e troca de item).
- Abastecimento não soma no lucro do dia (o dia usa o custo estimado; evita contar duas vezes).
- Consumo medido = média ponderada (km ÷ litros) dos últimos 3 intervalos.
- `MaintenanceItem` (Sprint 4) e as ports da IA (Sprint 5) só quando forem usados.
- Excluir lançamento pede confirmação com `window.confirm` (simples; trocar por diálogo no polimento).

**Pendente (usuário):** testar no iPhone/navegador.

---

## 2026-09-15 — Deploy na Vercel

**Feito (usuário):** repositório importado na Vercel (time `megamente12`, Hobby), preset **Vite**,
7 variáveis `VITE_*` preenchidas (sem o `VITE_APPCHECK_DEBUG_TOKEN`).

**Produção:** https://contas-motoboy-app-iphone.vercel.app

**Verificado (curl):**
- Domínio de produção responde 200 com o app.
- `manifest.webmanifest` (já com as cores azul-aqua), `sw.js`, `registerSW.js` e ícones → 200.
- `sw.js` com `cache-control: public, max-age=0, must-revalidate` (vercel.json funcionando).
- Rota direta `/resumo` → 200 com o `index.html` (rewrite de SPA funcionando).
- A URL do deploy com hash redireciona para o login da Vercel (Deployment Protection) — por isso a
  instalação no iPhone deve usar o domínio de produção (anotado no SETUP).

**Anotado para depois:** autorizar `contas-motoboy-app-iphone.vercel.app` no Firebase Auth
(Sprint 2) e no reCAPTCHA do App Check (Sprint 5).

**Pendente (usuário):** instalar na tela de início do iPhone e conferir.

---

## 2026-09-15 — Projeto Firebase criado

**Feito (usuário, no Console):** projeto **`motoboy-contas`** no plano **Spark**; Gemini no console
ligado (só assistente do Console, não afeta o app); **Google Analytics desligado**; app Web
`motoboycontas-web` registrado **sem** Firebase Hosting (deploy é na Vercel).

**Feito (código/docs):** `firebaseConfig` copiado para o `.env` local (fora do git), mantendo
`VITE_DATA_SOURCE=memory`. SETUP, SPRINTS e firebase/ atualizados com o ID real do projeto.
O `npm install firebase` e a inicialização ficam para a Sprint 2 (`src/services/firebase.ts`).

**Ainda não ativado:** Authentication, Firestore, AI Logic, App Check, Remote Config (Sprints 2 e 5).

---

## 2026-09-15 — Paleta azul-aqua (tons pastéis)

**Contexto:** Ao rodar o app, o usuário não gostou do verde. Pediu **azul, tons pastéis, azul-aqua**.

**Feito:**
- `plugins/vuetify.ts`: nova paleta nos temas claro e escuro, com token novo `aqua` (pastel, para
  detalhes e gráficos). Combustível virou âmbar suave e manutenção lavanda-azul, para combinar.
- **Acessibilidade:** pastel puro não é legível como texto sobre branco. No tema **claro** o `primary`
  é um aqua mais fechado (`#157499`) e os pastéis ficam nos fundos (`surface-variant`, tonais); no
  **escuro** os pastéis são as próprias cores de destaque (`#7FD1E6`). Contraste calculado (WCAG):
  todos os pares texto/fundo ≥ 4,5 (claro) e entre 7 e 10 (escuro).
- Ícone provisório em degradê aqua → azul; `theme-color` (index.html) e manifest atualizados;
  ícones do PWA gerados de novo.

**Verificação:** testes, type-check, lint e build sem erros.

---

## 2026-09-15 — Sprint 0: projeto Vue + Vuetify + PWA

**Feito:**
- Projeto **Vite 8 + Vue 3.5 + TypeScript 6.0 + Vuetify 4.2 + Pinia 3 + Vue Router 5** (mesma base do MegaMente).
- Pastas das camadas criadas (vazias com `.gitkeep` até receberem código).
- Tema claro/escuro seguindo o celular (verde = lucro, âmbar = combustível, azul = manutenção),
  fonte do sistema (SF Pro no iPhone) e utilitário `.mc-glass`.
- `AppLayout` com cabeçalho e barra de navegação inferior (Hoje, Novo, Resumo, Manutenção,
  Ajustes) + safe areas do iPhone; 5 telas placeholder.
- PWA com `vite-plugin-pwa` (manifest, service worker `autoUpdate`) e ícones gerados a partir de
  `public/favicon.svg` (ícone provisório: duas rodas + linha de lucro).
- `domain`: `parseMoney`, `parseDecimal`, `pricePerLiterCents`, `fuelCostCents`, `costPerKmCents`
  com **35 testes** usando os exemplos da REGRAS-DE-NEGOCIO.
- ESLint com a **regra de camadas** (`no-restricted-imports` com regex + `no-restricted-globals` no
  `domain`). Verificada com código de prova via stdin: acusou `vue`, `@/data` e `localStorage` no
  `domain`, e `@/data` numa page.
- `.env.example`, `vercel.json` (rewrite SPA + `sw.js` sem cache), `index.html` com as metas do iPhone.

**Verificação:** `npm test` (35 ok), `npm run type-check`, `npm run lint` e `npm run build` sem
erros. O build gera `manifest.webmanifest` e `sw.js`, e o `index.html` registra o service worker.

**Decisões pequenas:**
- TypeScript fixado em `~6.0` (o `typescript-eslint` ainda não aceita o TS 7) e
  `@vite-pwa/assets-generator` em `^1` (o `vite-plugin-pwa` 1.3 ainda não aceita o 2).
- Preço por litro é **taxa** com 3 casas → centavos com fração; só totais são inteiros (REGRAS, ADR-0007).
- `services/firebase.ts` fica para a Sprint 2, quando o projeto Firebase existir.

**Atenção:** o CSS do Vuetify vai inteiro (~540 kB, 86 kB gzip) — otimizar na Sprint 6.

**Pendente (usuário):** criar o projeto Firebase; deploy na Vercel e instalar no iPhone.

---

## 2026-09-15 — Troca de stack: PWA com Vue + Vuetify

**Contexto:**
- Ao preparar a Sprint 0 (SwiftUI): o Mac tem **só Command Line Tools** e **~27 GB livres**.
  Testado com um pacote de prova: `swift test` falha com `no such module 'Testing'` sem Xcode.
- Avaliado **React Native/Expo**: adia o Xcode mas não elimina (`@react-native-firebase` não roda
  no Expo Go; App Check é nativo; build no aparelho exige Xcode ou conta Apple paga). Tem efeito
  glass via `expo-glass-effect`.
- **Android ≈ 81%** dos celulares no Brasil, e há intenção de vender.
- O usuário propôs **web com Vuetify** (Tailwind opcional), stack que já usa no MegaMente, e
  confirmou que **não precisa de notificação** agora.

**Decisões:** PWA Vue 3 + TS + Vuetify 4, sem Tailwind → **ADR-0011**; camadas em TypeScript com
`domain` puro → **ADR-0012**; avisos dentro do app, sem push → **ADR-0013**. ADR-0001 e ADR-0002
marcados como substituídos.

**Feito (docs):**
- Reescritos: README, CLAUDE.md, `.gitignore` (Node/Vite), `docs/README`, SETUP, ARQUITETURA,
  componentes (wrappers `Mc*` estilo MegaMente, efeito `.mc-glass`), SPRINTS.
- Ajustados para web: ADR-0004, 0006, 0007, 0008, 0010; firebase/ (SDK Web, cache offline no
  IndexedDB, App Check com reCAPTCHA); ia/ (`firebase/ai`, Tesseract.js como plano B); fluxos/
  (barra inferior, safe areas, avisos no app); REGRAS (testes com Vitest).

**Continua valendo:** regras de negócio, modelagem do Firestore, IA, etanol × gasolina, snapshot por turno.

**Próximo:** Sprint 0 — projeto Vite + Vue + Vuetify, estrutura de pastas e Vitest rodando.

---

## 2026-09-15 — Etanol ou gasolina

**Contexto:** A moto pode ser abastecida com **etanol ou gasolina**, e o abastecimento precisa
registrar o **valor total** e os **litros** colocados.

**Feito (docs):**
- REGRAS-DE-NEGOCIO: nova seção **Abastecimento** (combustível + valor total + litros obrigatórios;
  preço/litro calculado e conferido); **consumo medido por combustível**, com tanques misturados
  fora da média; custo do turno usa o combustível do último abastecimento; novo comparativo
  **"Etanol ou gasolina?"** por R$/km.
- Firebase: `fuelings.fuelType` + `totalCents`; moto com `kmPerLiterGasoline`/`kmPerLiterEthanol`;
  preço padrão por combustível; `fuelTypeUsed` no snapshot do turno (ADR-0009).
- IA: schema do `fuelReceipt` (cupom ou visor da bomba) e ficha da moto com consumo por combustível.
- SPRINTS atualizadas (Sprints 1, 3 e 5).

---

## 2026-09-15 — Decisões iniciais respondidas

**Respostas do usuário:**
- Nome do app: **MotoboyContas** (prefixo de componentes `MC`).
- Uso **pessoal** no início; se gostar, tentar vender depois.
- iPhone de testes em **iOS 26.6.1**.
- **Não guardar fotos** — só as informações extraídas.
- Semana começa na **segunda**.
- **Moto:** o usuário informa a moto; a IA pesquisa consumo e demais dados na internet, mostra o
  resultado, e o usuário concorda ou muda. Pode trocar de moto e consumo a qualquer momento.

**Verificado:** o Firebase AI Logic suporta **Grounding with Google Search** nos modelos 3.x Flash
e Flash-Lite. Os termos exigem exibir as sugestões de busca e as fontes.

**Feito (docs):**
- Renomeado o app e o prefixo dos componentes em toda a documentação.
- ADR-0001 revisado: mínimo **iOS 18** (mesmos aparelhos do iOS 17, sem cortar XS/XR se for vendido).
- ADR-0005 aceito (sem fotos).
- Novos: **ADR-0008** (ficha da moto via IA com pesquisa), **ADR-0009** (snapshot por turno: trocar
  moto/consumo não altera o passado), **ADR-0010** (pessoal primeiro, pronto para produto).
- REGRAS-DE-NEGOCIO: seção **Moto**; km, consumo e manutenção por moto.
- Firebase: coleção `motorcycles`, `motorcycleId` e snapshot em `shifts`.
- IA: fluxo e schema da ficha da moto. Fluxos: onboarding da moto. SPRINTS atualizadas.

**Pendente:** confirmar plataformas além de iFood e 99Food. Instalar o Xcode.

---

## 2026-09-15 — Planejamento e documentação inicial

**Objetivo:** Sair de um repositório vazio (só README) para um plano claro, por sprints, com
arquitetura e regras de negócio definidas antes de escrever código.

**Contexto:** A ideia foi discutida antes com o Gemini: app para entregador lançar ganhos
(iFood/99Food), combustível, km e manutenção, com IA lendo prints e fotos. Existem apps parecidos
(Meu Corre, RODÔapp, For Driver), todos baseados em digitação manual; o diferencial aqui é a IA.

**Verificado e corrigido em relação à conversa com o Gemini:**
- `gemini-1.5-flash` e o SDK `google-ai-swift` estão **desatualizados** — Gemini 1.5 já foi
  desligado. Caminho atual: **Firebase AI Logic** + modelos Gemini 3.x Flash/Flash-Lite. → ADR-0006
- **Firebase Storage exige plano Blaze** para buckets novos (desde 30/10/2024). → ADR-0005
- **Login com Apple ID não funciona na conta Apple gratuita** (capability indisponível para
  Personal Team). → ADR-0004
- **App Check será obrigatório** para o AI Logic a partir de 02/11/2026. → ADR-0006
- Ler **nível de combustível** pela foto do painel é impreciso; consumo passa a ser calculado
  por km rodado e abastecimentos. → REGRAS-DE-NEGOCIO.md
- A máquina **não tem Xcode completo** (só Command Line Tools). → SETUP.md, Sprint 0

**Feito:**
- `README.md`, `CLAUDE.md` e `.gitignore` (Xcode, SwiftPM, `GoogleService-Info.plist`).
- `docs/`: índice, SPRINTS (0–6), ARQUITETURA, DECISOES (ADR-0001..0007), REGRAS-DE-NEGOCIO,
  SETUP, e as pastas `firebase/`, `ia/`, `componentes/`, `fluxos/`.

**Próximos passos:**
- [ ] Responder as decisões pendentes em SPRINTS.md.
- [ ] Instalar o Xcode e iniciar a Sprint 0.
