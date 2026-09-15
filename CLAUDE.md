# Contexto para agentes de IA

- App iOS nativo (SwiftUI) de controle financeiro para motoboys. Documentação completa em `docs/`.
- **Uso pessoal por enquanto**, com intenção de vender depois: manter multiusuário e sem custos fixos (ADR-0010).
- **Antes de mexer em algo, leia:** `docs/SPRINTS.md` (onde estamos), `docs/ARQUITETURA.md`
  (regras de dependência entre camadas) e `docs/DECISOES.md` (o que já foi decidido e por quê).
- **Sempre que criar/alterar algo, atualize a doc** correspondente: sprint (checkbox), diário,
  ADR se houve decisão, doc do componente/coleção/fluxo.
- Documentação em português; código (tipos, props, arquivos) em inglês.
- `Domain` nunca importa Firebase nem SwiftUI. Views nunca falam com Firebase.
- Dinheiro sempre em **centavos (`Int`)**; nunca `Double`.
- Commit e push só depois de confirmar com o usuário.
