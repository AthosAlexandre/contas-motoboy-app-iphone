# MotoboyContas

App **nativo para iPhone** que ajuda entregadores de moto (iFood, 99Food e outros) a saber o
**lucro real** do dia, da semana e do mês — descontando combustível e reservando dinheiro para
a manutenção da moto.

O diferencial: em vez de digitar tudo, o entregador **manda um print** (tela de ganhos do app)
ou uma **foto** (painel da moto, cupom do posto) e a **IA (Gemini)** extrai os números. O
usuário só confere e confirma. A entrada manual continua disponível sempre.

## Funcionalidades planejadas

- 💰 **Ganhos por plataforma** — iFood, 99Food e outras (lista editável).
- ⛽ **Combustível** — abastecimentos (valor, litros, km) e consumo médio (km/l).
- 🛣️ **Km rodados** — km inicial/final do turno (digitado ou lido da foto do painel).
- 🏍️ **Minha moto** — informe marca/modelo/ano; a IA pesquisa na internet consumo, tanque e plano
  de manutenção e mostra as fontes. Tudo editável; troque de moto quando quiser.
- 🔧 **Manutenção** — última troca de óleo/revisão, alertas por km e **reserva por km rodado**.
- 📸 **IA** — print/foto → dados estruturados → tela de confirmação → salva.
- 📊 **Relatórios** — dia/semana/mês, gráfico de pizza (ganhos por plataforma, gastos por
  categoria), gráfico de linha (evolução do lucro), tabelas e R$/km.

## Stack

- **SwiftUI** (iOS 18+) + **Swift Charts** — Swift 6.
- **Clean Architecture + MVVM**, com `Domain`, `Data` e `DesignSystem` como pacotes locais (SwiftPM).
- **Firebase**: Auth (e-mail/senha), Firestore (com cache offline), App Check, Remote Config.
- **Firebase AI Logic** + **Gemini Developer API** (plano gratuito) para ler prints e fotos.

## Documentação

Este projeto documenta **tudo**. Comece por [`docs/README.md`](docs/README.md).

- [SPRINTS.md](docs/SPRINTS.md) — plano de execução com checkboxes.
- [ARQUITETURA.md](docs/ARQUITETURA.md) — camadas, pastas e fluxo de dados.
- [DECISOES.md](docs/DECISOES.md) — decisões técnicas (ADR).
- [REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md) — fórmulas de lucro, consumo e reserva.
- [SETUP.md](docs/SETUP.md) — ambiente, Xcode e como rodar no iPhone.
- [DIARIO.md](docs/DIARIO.md) — diário de desenvolvimento.
