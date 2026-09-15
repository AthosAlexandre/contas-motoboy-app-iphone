# Arquitetura — MotoboyContas

## Visão geral

PWA mobile-first em **Vue 3 + TypeScript + Vuetify**, organizada em camadas no estilo
**Clean Architecture (ports & adapters)**. A estrutura de pastas é a mesma do MegaMente, com duas
pastas a mais: `domain/` (regras puras) e `data/` (implementações com Firebase e IA). Ver ADR-0011
e ADR-0012.

Objetivos:
- **Regras de negócio puras e testadas** (lucro, consumo, reserva) — sem Vue, sem Firebase, testes rápidos no Node.
- **Telas burras**: pages montam componentes e chamam hooks/actions; nenhuma regra de negócio.
- **Trocar a infraestrutura sem mexer nas telas**: dados em memória ↔ Firestore; Gemini → outro modelo.
- **Reaproveitar o `domain`** no app de loja (Expo/React Native) planejado para depois do PWA — por
  isso `domain` não usa nenhuma API de navegador (`window`, `document`, `localStorage`…).

## Camadas e regra de dependência

```
   pages · templates · components (Mc*)      ← apresentação (Vue + Vuetify)
                    │
                    ▼
            hooks · stores (Pinia)            ← estado de tela e estado global
                    │
                    ▼
                 actions                      ← casos de uso: orquestram regra + persistência
                 │       │
                 ▼       ▼
             domain ◄── data                  ← data implementa as interfaces (ports) do domain
            (puro)       │
                         ▼
                     services                 ← SDKs inicializados (Firebase, AI, App Check)
```

| Pasta | Pode importar | **Não** pode importar |
|-------|---------------|------------------------|
| `domain/` | nada (TypeScript puro) | vue, vuetify, firebase, qualquer outra pasta do app |
| `data/` | domain, services | vue, pages, components, stores, hooks |
| `services/` | firebase | resto do app |
| `actions/` | domain, data | vue, pages, components |
| `stores/`, `hooks/` | actions, domain (tipos), lib | services, data |
| `pages/`, `templates/` | hooks, stores, actions, components, lib, domain (tipos) | **services, data, firebase** |
| `components/` (`Mc*`) | vuetify, lib | domain, data, actions, stores, services |
| `lib/` | nada do app | — |

> Regra prática (igual ao MegaMente): **page não fala direto com o Firebase**. Page → hook/store →
> action → domain + data → services. A regra é verificada pelo ESLint (`no-restricted-imports`) —
> ADR-0012.

## Estrutura de pastas

```
contas-motoboy-app-iphone/
├── index.html
├── vite.config.ts              # vue + vuetify (autoImport) + PWA (manifest, service worker)
├── vercel.json                 # rewrite SPA
├── firestore.rules
├── .env.example
├── public/                     # ícones do PWA, apple-touch-icon
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── domain/                 # 🧠 PURO — sem Vue/Firebase. 100% testado.
│   │   ├── entities/           # types: Shift, Earning, Expense, Fueling, Motorcycle, MaintenanceItem, Platform
│   │   ├── money.ts            # centavos: parseMoney("145,90") → 14590
│   │   ├── numbers.ts          # decimais que não são dinheiro: parseDecimal("8,437") → 8.437
│   │   ├── calculators/        # profit.ts, fuel.ts (consumo por combustível), maintenance.ts, period.ts
│   │   ├── ports/              # interfaces: ShiftRepository, FuelingRepository, ReceiptExtractor, MotorcycleSpecsProvider…
│   │   └── errors.ts           # DomainError
│   ├── data/                   # 🔌 implementações das ports
│   │   ├── firestore/          # repositórios + mappers (documento ↔ entidade) + bootstrap do 1º acesso
│   │   ├── auth/               # login: Firebase Auth e o login fake do modo local
│   │   ├── memory/             # repositórios em memória (dev sem Firebase, testes)
│   │   ├── ai/                 # extractors Gemini, ficha da moto (Grounding), prompts, schemas
│   │   └── container.ts        # escolhe firestore ou memory (VITE_DATA_SOURCE) e exporta os repositórios
│   ├── actions/                # casos de uso: startShift, endShift (snapshot), addFueling, getPeriodSummary…
│   ├── services/               # firebase.ts (app, auth, db com cache offline, appCheck, ai), remoteConfig.ts
│   ├── stores/                 # Pinia: user, activeMotorcycle, openShift
│   ├── hooks/                  # composables useX: usePeriodSummary, useImageExtraction…
│   ├── components/             # wrappers Mc* — ver docs/componentes
│   ├── pages/                  # uma page = uma rota: today/, entry/, reports/, maintenance/, motorcycle/, settings/, auth/
│   ├── templates/              # AuthLayout, AppLayout (barra de navegação inferior + safe areas)
│   ├── routes/                 # Vue Router + guardas (logado → tem moto → app)
│   ├── plugins/                # vuetify.ts (tema claro/escuro), index.ts
│   ├── lib/                    # helpers de UI: formatadores (R$, km, datas), firebaseErrors, resizeImage
│   └── assets/styles/          # main.css (inclui o utilitário .mc-glass)
└── tests/
    └── unit/                   # Vitest: domain/ e actions/ (com repositórios em memória)
```

## Padrões por camada

### domain
- `type`/`interface` + **funções puras**. Sem classes com estado, sem `async`.
- Dinheiro em **centavos inteiros** (ADR-0007), com um único `parseMoney()`.
  ```ts
  // src/domain/calculators/fuel.ts
  export function fuelCostCents(km: number, kmPerLiter: number, pricePerLiterCents: number): number {
    if (km <= 0 || kmPerLiter <= 0) return 0
    return Math.round((km / kmPerLiter) * pricePerLiterCents)
  }
  ```

### data
- Cada repositório Firestore converte **documento ↔ entidade** num mapper: o formato do banco pode
  mudar sem afetar o `domain`.
- A IA implementa `ReceiptExtractor` e `MotorcycleSpecsProvider`; fora de `data/ai` ninguém sabe que é Gemini.
- `container.ts` é o único lugar que decide qual implementação usar.
- **Modo local (até a Sprint 2):** `data/memory` salva os dados no próprio aparelho (localStorage), com
  iFood/99Food, uma moto de exemplo e preços padrão (`memory/seed.ts`). Nos testes, os mesmos
  repositórios rodam só em memória (`setRepos(createMemoryRepos())`).
- **Modo Firebase (`VITE_DATA_SOURCE=firestore`):** `initData()` (chamado no `main.ts` antes de montar)
  baixa o SDK por import dinâmico, cria o `AuthService` e, **a cada mudança de sessão**, roda o bootstrap
  do usuário e troca `repos` para `users/{uid}`. Só depois avisa os ouvintes (`onSessionChange`), então
  quem reage ao login já encontra os repositórios certos.

### actions (casos de uso)
- Uma função por ação do usuário: valida com o `domain` e persiste pelos repositórios do container.
  ```ts
  // src/actions/fuelings.ts
  import { repos } from '@/data/container'
  import { DomainError } from '@/domain/errors'
  import { pricePerLiterCents } from '@/domain/calculators/fuel'
  import type { NewFueling } from '@/domain/entities'

  export async function addFueling(input: NewFueling) {
    if (input.totalCents <= 0 || input.liters <= 0) throw new DomainError('invalid-fueling')
    return repos.fuelings.save({
      ...input,
      pricePerLiterCents: pricePerLiterCents(input.totalCents, input.liters),
    })
  }
  ```

### stores e hooks
- **Pinia** para estado global (usuário, moto ativa, turno aberto).
- **Hooks** (composables) para o estado de uma tela: `loading`, `error`, dados já formatados.
- Hoje: `stores/today` (dia atual: turno, lançamentos, resumo) e `hooks/useAsyncAction` (salvar com
  carregando + aviso de sucesso/erro; `DomainError` mostra a própria mensagem).
- `stores/session`: usuário logado e moto ativa. As **guardas de rota** (`routes/index.ts`) usam a sessão:
  sem login → `/conta/entrar`; logado sem moto → `/moto`; logado em tela de conta → Hoje.
- `hooks/useFormSubmit`: formulários de conta com erro exibido no próprio card.

### pages e components
- Pages montam a tela com componentes `Mc*` e chamam hooks/actions. Sem regra de negócio.
- `Mc*` são wrappers do Vuetify com props tipadas, `defineModel` e slots — ver
  [componentes/README.md](./componentes/README.md).

## Fluxo de dados — abastecimento pela foto do cupom

```
Usuário toca 📸 e fotografa o cupom (McImagePicker → <input type="file" accept="image/*">)
        │  redimensiona no canvas (~1600 px, JPEG)
        ▼
useImageExtraction → action extractFromImage('fuelReceipt', imagem)
        ▼
ReceiptExtractor (port do domain) ── implementado por data/ai (Firebase AI Logic + App Check)
        ▼
JSON { fuelType, totalAmount, liters, pricePerLiter, confidence }
        ▼
Tela "Confirmar leitura" (McCurrencyField, McNumberField, McFuelTypeToggle) — campos editáveis
        │  usuário confirma
        ▼
action addFueling ──► repos.fuelings (Firestore com cache offline) ──► users/{uid}/fuelings
        ▼
stores/hooks recalculam → telas Hoje e Resumo atualizam
```

A entrada manual é o **mesmo fluxo sem as 3 primeiras etapas**.

## Referências cruzadas
- Decisões que justificam essas escolhas: [DECISOES.md](./DECISOES.md).
- Fórmulas usadas pelas calculadoras: [REGRAS-DE-NEGOCIO.md](./REGRAS-DE-NEGOCIO.md).
