# 🗺️ Plano de Sprints — MotoboyContas

Plano de execução dividido em sprints. Marcar `- [x]` conforme concluir.
O escopo pode mudar durante o desenvolvimento — mudanças ficam registradas abaixo.

**Estratégia:** primeiro o app funciona **100% com entrada manual** e cálculos corretos
(Sprints 1–4). A IA entra na Sprint 5 **preenchendo o mesmo formulário** — se a IA falhar,
nada quebra.

## ✅ Decisões iniciais (respondidas em 2026-09-15)
- [x] **Nome do app:** `MotoboyContas`. Prefixo dos componentes: `MC`.
- [x] **Versão do iOS:** iPhone de testes em iOS 26.6.1. Mínimo do app: **iOS 18** (ADR-0001).
- [x] **Uso:** pessoal no início; se der certo, vender depois → multiusuário desde já (ADR-0010).
- [x] **Fotos:** **não** guardar — servem só para extrair as informações (ADR-0005).
- [x] **Semana:** começa na **segunda**.
- [x] **Moto:** o usuário informa a moto no app; a **IA pesquisa na internet** consumo, tanque e
      plano de manutenção, mostra com as fontes, e o usuário aceita ou edita. Pode trocar de moto
      e de consumo a qualquer momento (ADR-0008, ADR-0009).
- [ ] **Plataformas:** padrão iFood e 99Food, lista editável no app (confirmar se usa outras).

## Mudanças de escopo registradas
- ➕ **Minha moto com ficha pesquisada pela IA** (Grounding com Google Search) — cadastro manual
  na Sprint 2, sugestão por IA na Sprint 5.
- ➕ **Troca de moto/consumo a qualquer momento** sem alterar relatórios passados (snapshot por turno).
- ➕ **Etanol ou gasolina:** abastecimento registra combustível, **valor total** e **litros**;
  consumo medido separado por combustível; comparativo de R$/km entre os dois.

---

## 🗓️ Sprint 0 — Setup e fundações
**Ambiente**
- [ ] Instalar o **Xcode completo** (hoje só há Command Line Tools — ver SETUP.md)
- [ ] Adicionar Apple ID no Xcode (Personal Team) e ativar Modo Desenvolvedor no iPhone
- [ ] Rodar um "Hello World" no iPhone físico (validar assinatura gratuita)

**Projeto**
- [ ] Criar projeto Xcode `MotoboyContas` (SwiftUI, iOS 18+, Swift 6)
- [ ] Criar pacotes locais `Packages/Domain`, `Packages/Data`, `Packages/DesignSystem`
- [ ] Estrutura de pastas conforme [ARQUITETURA.md](./ARQUITETURA.md)
- [ ] `AppContainer` (composition root / injeção de dependências)
- [ ] `DesignSystem`: tokens (cores, tipografia, espaçamentos) + tema claro/escuro

**Firebase**
- [ ] Criar projeto Firebase (plano Spark) + app iOS + baixar `GoogleService-Info.plist`
- [ ] Adicionar `firebase-ios-sdk` via SwiftPM (Auth, Firestore, AI Logic, App Check, Remote Config)
- [ ] `FirebaseApp.configure()` no launch

**Docs**
- [x] Estrutura de documentação (`docs/`) e plano de sprints
- [x] Responder as decisões iniciais (2026-09-15)

## 🗓️ Sprint 1 — Domínio e cálculos (sem Firebase)
**Domain (pacote puro, testado)**
- [ ] Entidades: `Shift` (turno), `Earning`, `Expense`, `Fueling`, `MaintenanceItem`, `Platform`, `Motorcycle`
- [ ] Value objects: `Money` (centavos), `Kilometers`, `DateRange` (dia/semana/mês)
- [ ] Protocolos de repositório (`ShiftRepository`, `EarningRepository`…)
- [ ] Calculadoras: lucro bruto/líquido, R$/km, consumo km/l, custo estimado de combustível,
      reserva de manutenção — ver [REGRAS-DE-NEGOCIO.md](./REGRAS-DE-NEGOCIO.md)
- [ ] Use cases: `StartShift`, `EndShift`, `AddEarning`, `AddExpense`, `AddFueling`, `GetPeriodSummary`
- [ ] `EndShift` grava o **snapshot** dos cálculos (consumo, preço, custo, reserva) — ADR-0009
- [ ] Km, consumo e manutenção sempre **por moto** (`motorcycleId`)
- [ ] Abastecimento com **combustível (gasolina/etanol), valor total e litros** (preço/litro calculado);
      consumo medido **por combustível**, ignorando tanques misturados
- [ ] Testes (Swift Testing) cobrindo todas as fórmulas e casos de borda

**App (entrada manual, dados em memória)**
- [ ] Repositórios `InMemory*` para desenvolver telas sem backend
- [ ] Componentes base: `MCButton`, `MCCard`, `MCCurrencyField`, `MCNumberField`, `MCSegmentedPicker`
- [ ] Tela **Hoje**: iniciar/encerrar turno (km inicial/final), lançar ganho/gasto
- [ ] Tela **Novo registro** (manual): ganho, gasto, abastecimento (combustível, valor total, litros,
      km, tanque cheio?)

## 🗓️ Sprint 2 — Firebase: login e persistência
- [ ] Auth e-mail/senha: cadastro, login, reset de senha, sair (ver ADR-0004)
- [ ] Modelagem Firestore `users/{uid}/...` — ver [firebase/](./firebase/README.md)
- [ ] Repositórios `Firestore*` no pacote `Data` (DTO ↔ entidade via mappers)
- [ ] Cache offline do Firestore (lançar sem sinal, sincroniza depois)
- [ ] `firestore.rules`: cada usuário só lê/escreve os próprios dados + publicar
- [ ] Trocar `InMemory*` por `Firestore*` no `AppContainer` (sem mexer nas telas)
- [ ] Tela **Ajustes**: plataformas, preço médio do litro
- [ ] **Minha moto** (manual): marca, modelo, ano, cilindrada, consumo, tanque, intervalos de
      manutenção; editar e **trocar de moto** a qualquer momento (ADR-0009)

## 🗓️ Sprint 3 — Relatórios e gráficos
- [ ] Use case `GetPeriodSummary` ligado ao Firestore (dia / semana / mês)
- [ ] Tela **Resumo**: seletor de período + cards (ganho, gasto, lucro, km, R$/km)
- [ ] `MCPieChart` — ganhos por plataforma e gastos por categoria (Swift Charts `SectorMark`)
- [ ] `MCLineChart` — evolução do lucro diário no mês
- [ ] Tabela/lista de lançamentos do período (editar/excluir)
- [ ] Comparativo mês a mês (lucro de cada mês)
- [ ] Etanol × gasolina: R$/km de cada um com o consumo medido ("qual compensa hoje")

## 🗓️ Sprint 4 — Manutenção e reservas
- [ ] Cadastro de itens de manutenção (óleo, relação, pneus, freios, revisão…) com
      intervalo em km e/ou dias e custo estimado
- [ ] Registrar "fiz a troca" (km + data + valor real)
- [ ] Progresso até a próxima troca ("faltam 300 km") + alertas
- [ ] **Reserva de manutenção** por km rodado, somada no resumo do dia/semana
- [ ] Notificações locais quando um item estiver perto do vencimento

## 🗓️ Sprint 5 — IA: print/foto → dados
- [ ] Firebase AI Logic com Gemini Developer API (modelo via Remote Config — ADR-0006)
- [ ] App Check (obrigatório para AI Logic a partir de 02/11/2026 — ver [ia/](./ia/README.md))
- [ ] `PhotosPicker` (galeria/prints) + câmera
- [ ] Extratores com saída JSON estruturada:
  - [ ] Print de ganhos (iFood / 99Food)
  - [ ] Foto do painel (odômetro; nível de combustível aproximado)
  - [ ] Cupom do posto ou visor da bomba (combustível, valor total, litros, preço/litro)
- [ ] Tela **Confirmar leitura**: campos pré-preenchidos e editáveis → salvar
- [ ] Salvar `aiExtractions` (texto/JSON extraído + status) para auditoria
- [ ] Tratamento de erro/limite de cota → cai para o formulário manual

**Ficha da moto pela IA (ADR-0008)**
- [ ] `MotorcycleSpecsProvider` com **Grounding with Google Search** (marca/modelo/ano → ficha + fontes)
- [ ] Validar se o modelo aceita JSON schema junto com a pesquisa (senão, 2ª chamada para estruturar)
- [ ] Tela **Ficha sugerida**: valores editáveis, fontes com link, sugestões de busca do Google
      (exigência dos termos) e aviso de consumo de fabricante × uso real
- [ ] Sugerir trocar para o **consumo medido** quando houver 2 abastecimentos com tanque cheio

## 🗓️ Sprint 6 — Polimento
- [ ] Onboarding: cadastrar moto → IA sugere a ficha → confirmar → plataformas → itens de manutenção
- [ ] Ícone, tela de abertura, estados vazios e de carregamento
- [ ] Exportar CSV do período
- [ ] Revisão de acessibilidade (Dynamic Type, VoiceOver) e modo escuro
- [ ] Decidir distribuição: continuar Personal Team (7 dias) ou Apple Developer (TestFlight)

## 🔮 Futuro (fora do escopo atual)
- Android (Kotlin/Compose ou KMP reaproveitando as regras do `Domain`)
- Guardar fotos no Storage (exige Blaze)
- Widgets e Live Activity do turno (App Groups exigem conta paga)
- Metas de ganho diário/semanal
- **Virar produto** (ADR-0010): Apple Developer + App Store, Sign in with Apple, assinatura,
  termos/LGPD, plano pago do Gemini e custo de IA por usuário
