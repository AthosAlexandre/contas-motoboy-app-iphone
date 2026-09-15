# 🗺️ Plano de Sprints — MotoboyContas

Plano de execução dividido em sprints. Marcar `- [x]` conforme concluir.
O escopo pode mudar durante o desenvolvimento — mudanças ficam registradas abaixo.

**Estratégia:** primeiro o app funciona **100% com entrada manual** e cálculos corretos
(Sprints 1–4). A IA entra na Sprint 5 **preenchendo o mesmo formulário** — se a IA falhar,
nada quebra.

## ✅ Decisões (respondidas em 2026-09-15)
- [x] **Nome do app:** `MotoboyContas`. Prefixo dos componentes: `Mc`.
- [x] **Stack:** PWA com **Vue 3 + TypeScript + Vuetify 4**, sem Tailwind (ADR-0011).
- [x] **Aparelhos:** iPhone (Safari, iOS 26.6.1) e Android (Chrome), instalado na tela de início.
- [x] **Uso:** pessoal no início; se der certo, vender depois → multiusuário desde já (ADR-0010).
- [x] **Fotos:** **não** guardar — servem só para extrair as informações (ADR-0005).
- [x] **Semana:** começa na **segunda**.
- [x] **Moto:** o usuário informa a moto; a **IA pesquisa na internet** consumo, tanque e plano de
      manutenção, mostra com as fontes, e o usuário aceita ou edita. Pode trocar de moto e de
      consumo a qualquer momento (ADR-0008, ADR-0009).
- [x] **Combustível:** etanol ou gasolina; o abastecimento registra **valor total** e **litros**.
- [x] **Notificações:** sem push por enquanto; avisos **dentro do app** (ADR-0013).
- [ ] **Plataformas:** padrão iFood e 99Food, lista editável no app (confirmar se usa outras).

## Mudanças de escopo registradas
- 🔁 **Stack trocada de iOS nativo (SwiftUI) para PWA Vue + Vuetify** (ADR-0011): Mac sem Xcode e
  com pouco disco, Android é a maioria no Brasil e a stack já é dominada (MegaMente).
- ❌ **Sem notificações push** (ADR-0013) — alertas de manutenção dentro do app.
- ➕ **Minha moto com ficha pesquisada pela IA** (Grounding com Google Search) — cadastro manual
  na Sprint 2, sugestão por IA na Sprint 5.
- ➕ **Troca de moto/consumo a qualquer momento** sem alterar relatórios passados (snapshot por turno).
- ➕ **Etanol ou gasolina:** abastecimento registra combustível, **valor total** e **litros**;
  consumo medido separado por combustível; comparativo de R$/km entre os dois.

---

## 🗓️ Sprint 0 — Setup e fundações
**Projeto**
- [x] Vite + Vue 3 + TypeScript + Vuetify 4 (`vite-plugin-vuetify` com autoImport) + ícones MDI
- [x] `.gitignore`, `.env.example`, `vercel.json` (rewrite SPA)
- [x] Estrutura de pastas conforme [ARQUITETURA.md](./ARQUITETURA.md) (`domain/`, `data/`, `actions/`…)
- [x] Vue Router + Pinia + `plugins/index.ts`
- [x] Tema MotoboyContas claro/escuro em `plugins/vuetify.ts` + utilitário `.mc-glass`
- [x] `AppLayout` mobile-first: barra de navegação inferior (Hoje, Novo, Resumo, Manutenção, Ajustes) + safe areas do iPhone (telas ainda como placeholder)
- [x] PWA: `vite-plugin-pwa` (manifest, ícones, `apple-touch-icon`, service worker) — ícone provisório

**Qualidade**
- [x] Vitest + primeiros testes em `src/domain` (35 testes)
- [x] ESLint com a regra de imports entre camadas (ADR-0012) — verificada com código de prova
- [x] Scripts: `dev`, `build`, `test`, `type-check`, `lint`, `icons`

**Firebase e deploy**
- [x] **(você)** Criar o projeto Firebase (Spark) + app Web → preencher o `.env` — projeto `motoboy-contas`
- [ ] `services/firebase.ts` — feito na Sprint 2, quando o projeto existir
- [x] **(você)** Deploy na Vercel — produção em https://contas-motoboy-app-iphone.vercel.app
- [ ] **(você)** Instalar na tela de início do iPhone pelo domínio de produção (validar o PWA)

**Docs**
- [x] Estrutura de documentação (`docs/`) e plano de sprints
- [x] Decisões iniciais (2026-09-15)

## 🗓️ Sprint 1 — Domínio e cálculos (sem Firebase) — código pronto, falta testar no iPhone
**Domain (`src/domain`, puro e testado)**
- [x] Entidades: `Shift` (turno), `Earning`, `Expense`, `Fueling`, `Platform`, `Motorcycle`, `Settings`
      + `period.ts` (dia em São Paulo, semana seg–dom, mês) — `MaintenanceItem` fica para a Sprint 4
- [x] `money.ts` (`parseMoney("145,90")` → centavos) e `numbers.ts` (`parseDecimal`) — adiantado na Sprint 0
- [x] Calculadoras: lucro bruto/líquido, R$/km, preço/litro, consumo **por combustível** (tanque cheio,
      ignorando tanques misturados), custo de combustível do turno, etanol × gasolina, reserva de
      manutenção — ver [REGRAS-DE-NEGOCIO.md](./REGRAS-DE-NEGOCIO.md)
      (`fuel.ts`, `shift.ts` com o snapshot, `profit.ts`, `maintenance.ts`)
- [x] Ports: interfaces dos repositórios (`ReceiptExtractor` e `MotorcycleSpecsProvider` ficam para a Sprint 5)
- [x] Testes (Vitest) cobrindo as fórmulas, casos de borda e o fluxo completo do dia — 85 testes no total

**Actions + dados em memória**
- [x] Repositórios `data/memory/` (salvos no aparelho via localStorage) + `data/container.ts`
- [x] Actions: `startShift`, `endShift` (grava o **snapshot** — ADR-0009), `addEarning`, `addExpense`,
      `addFueling`, `getPeriodSummary`
- [x] Km, consumo e manutenção sempre **por moto** (`motorcycleId`)

**Telas (entrada manual)**
- [x] Componentes: `McCurrencyField`, `McNumberField`, `McFuelTypeToggle`, `McStatCard`
- [x] Tela **Hoje**: iniciar/encerrar turno (km inicial/final), lançamentos do dia, "quanto guardar"
- [x] Tela **Novo registro** (manual): ganho, gasto, abastecimento (combustível, valor total, litros,
      km, tanque cheio?)
- [ ] **(você)** Testar o fluxo no iPhone/navegador (os dados ficam só no aparelho até a Sprint 2)

## 🗓️ Sprint 2 — Firebase: login e persistência
- [ ] Auth e-mail/senha: cadastro, login, reset de senha, sair (ADR-0004) + guardas de rota
- [ ] Modelagem Firestore `users/{uid}/...` — ver [firebase/](./firebase/README.md)
- [ ] Repositórios `data/firestore/` com mappers; trocar no `container.ts` (sem mexer nas telas)
- [ ] Cache offline do Firestore (lançar sem sinal, sincroniza depois)
- [ ] `firestore.rules`: cada usuário só lê/escreve os próprios dados + publicar
- [ ] Tela **Ajustes**: plataformas, preço padrão de gasolina e etanol
- [ ] **Minha moto** (manual): marca, modelo, ano, cilindrada, flex?, consumo por combustível, tanque,
      intervalos de manutenção; editar e **trocar de moto** a qualquer momento (ADR-0009)

## 🗓️ Sprint 3 — Relatórios e gráficos
- [ ] Escolher a biblioteca de gráficos (ADR): leve e boa no celular
- [ ] `getPeriodSummary` ligado ao Firestore (dia / semana / mês)
- [ ] Tela **Resumo**: `McPeriodPicker` + cards (ganho, gasto, lucro, km, R$/km)
- [ ] `McPieChart` — ganhos por plataforma e gastos por categoria
- [ ] `McLineChart` — evolução do lucro diário no mês
- [ ] Lista/tabela de lançamentos do período (editar/excluir)
- [ ] Comparativo mês a mês (lucro de cada mês)
- [ ] Etanol × gasolina: R$/km de cada um com o consumo medido ("qual compensa hoje")

## 🗓️ Sprint 4 — Manutenção e reservas
- [ ] Itens de manutenção (óleo, relação, pneus, freios, revisão…) com intervalo em km e/ou dias
      e custo estimado
- [ ] Registrar "fiz a troca" (km + data + valor real)
- [ ] Progresso até a próxima troca ("faltam 300 km") com `McProgressBar`
- [ ] **Reserva de manutenção** por km rodado, somada no resumo do dia/semana
- [ ] Avisos **dentro do app** (ADR-0013): `McAlertBanner` na tela Hoje + badge na aba Manutenção

## 🗓️ Sprint 5 — IA: print/foto → dados
- [ ] Firebase AI Logic (`firebase/ai`) com Gemini Developer API; modelo via Remote Config (ADR-0006)
- [ ] App Check com **reCAPTCHA Enterprise** (obrigatório para AI Logic a partir de 02/11/2026) +
      debug token em desenvolvimento — ver [ia/](./ia/README.md)
- [ ] `McImagePicker`: câmera/galeria + redimensionar no canvas antes de enviar
- [ ] Extratores com saída JSON estruturada:
  - [ ] Print de ganhos (iFood / 99Food)
  - [ ] Foto do painel (odômetro; nível de combustível aproximado)
  - [ ] Cupom do posto ou visor da bomba (combustível, valor total, litros, preço/litro)
- [ ] Tela **Confirmar leitura**: campos pré-preenchidos e editáveis → salvar
- [ ] Salvar `aiExtractions` (JSON extraído + status) para auditoria
- [ ] Tratamento de erro/limite de cota → cai para o formulário manual

**Ficha da moto pela IA (ADR-0008)**
- [ ] `MotorcycleSpecsProvider` com **Grounding with Google Search** (marca/modelo/ano → ficha + fontes)
- [ ] Validar se o modelo aceita JSON schema junto com a pesquisa (senão, 2ª chamada para estruturar)
- [ ] Tela **Ficha sugerida**: valores editáveis, `McSourceList`, `McSearchSuggestions` (exigência dos
      termos) e aviso de consumo de fabricante × uso real
- [ ] Sugerir trocar para o **consumo medido** quando houver 2 abastecimentos com tanque cheio

## 🗓️ Sprint 6 — Polimento
- [ ] Onboarding: como instalar na tela de início → cadastrar moto (IA) → plataformas → itens de manutenção
- [ ] Ícones, tela de abertura, estados vazios e de carregamento
- [ ] Exportar CSV do período
- [ ] Acessibilidade, modo escuro e efeito vidro (`.mc-glass`) nos pontos certos
- [ ] Uma semana de uso real no iPhone e ajustes

## 🔮 Futuro (fora do escopo atual)
- Notificações push (FCM + Cloud Functions → plano Blaze)
- Guardar fotos no Storage (plano Blaze)
- 📱 **Fase App (planejada, depois do PWA validado):** apps nas lojas com Expo/React Native,
  reaproveitando `src/domain`
- Metas de ganho diário/semanal
- **Virar produto** (ADR-0010): domínio próprio, assinatura, termos/LGPD, plano pago do Gemini e
  custo de IA por usuário
