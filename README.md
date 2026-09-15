# MotoboyContas

App **web instalável (PWA)** para iPhone e Android que ajuda entregadores de moto (iFood, 99Food e
outros) a saber o **lucro real** do dia, da semana e do mês — descontando combustível e reservando
dinheiro para a manutenção da moto.

O diferencial: em vez de digitar tudo, o entregador **manda um print** (tela de ganhos do app)
ou uma **foto** (painel da moto, cupom do posto) e a **IA (Gemini)** extrai os números. O
usuário só confere e confirma. A entrada manual continua disponível sempre.

## Funcionalidades planejadas

- 💰 **Ganhos por plataforma** — iFood, 99Food e outras (lista editável).
- ⛽ **Combustível** — abastecimentos com **etanol ou gasolina** (valor total e litros) e consumo
  medido por combustível; comparativo de qual compensa.
- 🛣️ **Km rodados** — km inicial/final do turno (digitado ou lido da foto do painel).
- 🏍️ **Minha moto** — informe marca/modelo/ano; a IA pesquisa na internet consumo, tanque e plano
  de manutenção e mostra as fontes. Tudo editável; troque de moto quando quiser.
- 🔧 **Manutenção** — última troca de óleo/revisão, avisos por km e **reserva por km rodado**.
- 📸 **IA** — print/foto → dados estruturados → tela de confirmação → salva.
- 📊 **Relatórios** — dia/semana/mês, gráfico de pizza (ganhos por plataforma, gastos por
  categoria), gráfico de linha (evolução do lucro), tabelas e R$/km.

## Stack

- **Vue 3 + TypeScript + Vuetify 4 + Vite**, PWA mobile-first (instala na tela de início).
- **Camadas:** `domain` (regras puras) · `data` (Firebase/IA) · `actions` (casos de uso) · telas.
- **Firebase** (plano Spark): Auth (e-mail/senha), Firestore (cache offline), App Check, Remote Config.
- **Firebase AI Logic + Gemini** (free tier), com pesquisa Google para a ficha da moto.
- **Vitest** para as regras de negócio · **Vercel** para o deploy.

## Como rodar

```bash
npm install
cp .env.example .env   # chaves do Firebase
npm run dev
```

Detalhes (Firebase, testar no celular, instalar na tela de início) em [docs/SETUP.md](docs/SETUP.md).

## Documentação

Este projeto documenta **tudo**. Comece por [`docs/README.md`](docs/README.md).

- [SPRINTS.md](docs/SPRINTS.md) — plano de execução com checkboxes.
- [ARQUITETURA.md](docs/ARQUITETURA.md) — camadas, pastas e fluxo de dados.
- [DECISOES.md](docs/DECISOES.md) — decisões técnicas (ADR).
- [REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md) — fórmulas de lucro, consumo e reserva.
- [SETUP.md](docs/SETUP.md) — ambiente, Firebase e deploy.
- [DIARIO.md](docs/DIARIO.md) — diário de desenvolvimento.

> O repositório nasceu como app iPhone nativo (daí o nome `contas-motoboy-app-iphone`); a stack
> mudou para web — ver ADR-0011.
