# Diário de Desenvolvimento — MotoboyContas

Registro do que foi feito, quando e por quê. Ordem cronológica (mais recente no topo).

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
