# 📚 Documentação — MotoboyContas

Central de documentação. **Sempre que criarmos/alterarmos algo, atualizamos aqui** para manter o
contexto vivo (telas, componentes, cálculos, coleções do Firebase, prompts da IA).

## Estrutura

| Arquivo / Pasta | O que documenta |
|-----------------|-----------------|
| [`SPRINTS.md`](./SPRINTS.md) | Plano de execução por sprint, com checkboxes de progresso e decisões pendentes. |
| [`ARQUITETURA.md`](./ARQUITETURA.md) | Camadas (Clean Architecture + MVVM), estrutura de pastas e fluxo de dados. |
| [`DECISOES.md`](./DECISOES.md) | Registro de decisões técnicas (ADR): contexto, decisão, alternativas, consequências. |
| [`REGRAS-DE-NEGOCIO.md`](./REGRAS-DE-NEGOCIO.md) | Entidades e fórmulas: lucro, R$/km, consumo, reserva de manutenção. |
| [`SETUP.md`](./SETUP.md) | Ambiente (Xcode), Firebase, rodar no iPhone com conta Apple gratuita. |
| [`DIARIO.md`](./DIARIO.md) | Diário de desenvolvimento (o que foi feito, quando e por quê). Mais recente no topo. |
| [`fluxos/`](./fluxos/) | Fluxo de cada tela: o que o usuário faz, para onde vai, o que a tela consome. |
| [`componentes/`](./componentes/) | Componentes do `DesignSystem`: parâmetros ("props"), bindings, slots e exemplos. |
| [`firebase/`](./firebase/) | Auth, modelagem do Firestore, regras de segurança, App Check, Remote Config. |
| [`ia/`](./ia/) | Extração por IA: modelos, prompts, schema de saída, limites e custos. |

## Convenções

- **Idioma:** documentação em português; código (tipos, propriedades, arquivos) em inglês.
- **Um assunto por arquivo**, com título claro. Ex: `fluxos/novo-registro.md`, `componentes/mc-currency-field.md`.
- Criou componente no `DesignSystem` → cria o `.md` em `componentes/` e adiciona no índice.
- Criou coleção/regra no Firestore → documenta em `firebase/`.
- Mudou prompt ou schema da IA → documenta em `ia/`.
- Tomou uma decisão técnica que alguém poderia questionar depois → novo ADR em `DECISOES.md`.
- Fechou um bloco de trabalho → marca checkbox em `SPRINTS.md` + entrada no `DIARIO.md`.

## Stack

- **App:** SwiftUI (iOS 18+), Swift 6, Swift Charts, `@Observable`
- **Arquitetura:** Clean Architecture + MVVM; pacotes locais `Domain`, `Data`, `DesignSystem`
- **Back/Infra:** Firebase (Auth, Firestore, App Check, Remote Config) — plano Spark (gratuito)
- **IA:** Firebase AI Logic + Gemini Developer API (free tier)
- **Testes:** Swift Testing (`import Testing`) no `Domain`
