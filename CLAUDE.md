# Contexto para agentes de IA

- **PWA mobile-first** (Vue 3 + TypeScript + Vuetify 4 + Vite + Firebase) de controle financeiro para
  motoboys. Segue os mesmos padrões do projeto MegaMente (`../curso-online-professor-megamente`).
  Documentação completa em `docs/`.
- **Uso pessoal por enquanto**, com intenção de vender depois: manter multiusuário e sem custos fixos (ADR-0010).
- **Antes de mexer em algo, leia:** `docs/SPRINTS.md` (onde estamos), `docs/ARQUITETURA.md`
  (regras de dependência entre camadas) e `docs/DECISOES.md` (o que já foi decidido e por quê).
- **Sempre que criar/alterar algo, atualize a doc** correspondente: sprint (checkbox), diário,
  ADR se houve decisão, doc do componente/coleção/fluxo.
- Documentação em português; código (tipos, props, arquivos) em inglês.
- `src/domain` não importa Vue, Vuetify nem Firebase, **nem usa APIs de navegador** (`window`,
  `document`, `localStorage`…): será reaproveitado no app de loja (Expo) planejado para depois do PWA. Pages/components nunca importam `services`,
  `data` ou `firebase` — usam `actions`, `hooks` e `stores`.
- Dinheiro sempre em **centavos inteiros**; nunca ponto flutuante para dinheiro (ADR-0007).
- Sem Tailwind (ADR-0011). Sem notificações push (ADR-0013).
- **O usuário faz commit e push manualmente** — não commitar; ao fim de cada bloco, listar o que mudou.
