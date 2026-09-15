# Arquitetura — MotoboyContas

## Visão geral

**Clean Architecture + MVVM**, com as camadas separadas em **pacotes Swift locais**. Separar em
pacotes não é enfeite: o compilador **impede** que uma camada importe o que não deve (ex.: o
`Domain` simplesmente não tem o Firebase disponível). Ver ADR-0002.

Objetivos:
- **Regras de negócio puras e testadas** (lucro, consumo, reserva) — sem Firebase, sem UI.
- **Views burras**: só apresentação; estado e ações ficam no ViewModel.
- **Trocar a infraestrutura sem mexer nas telas**: repositório em memória → Firestore; Gemini → outro modelo.
- **Facilitar o port para Android**: o `Domain` é Swift puro, tradução quase 1:1 para Kotlin.

## Camadas e regra de dependência

```
                ┌──────────────────────────┐
                │           App            │  composition root: cria tudo e injeta
                └────────────┬─────────────┘
          ┌──────────────────┼───────────────────┐
          ▼                  ▼                   ▼
  ┌───────────────┐  ┌───────────────┐   ┌───────────────┐
  │   Features    │  │     Data      │   │ DesignSystem  │
  │ Views + VMs   │  │ Firebase, IA  │   │ componentes   │
  └──────┬────────┘  └──────┬────────┘   └───────────────┘
         │                  │                   ▲
         ▼                  ▼                   │
      ┌──────────────────────────┐              │
      │          Domain          │   Features ──┘
      │ entidades, use cases,    │
      │ protocolos, calculadoras │
      └──────────────────────────┘
```

As setas apontam **para dentro**: tudo depende do `Domain`; o `Domain` não depende de nada.

| Camada | Pode importar | **Não** pode importar |
|--------|---------------|------------------------|
| `Domain` | Foundation | SwiftUI, Firebase, qualquer outra camada |
| `Data` | Domain, Firebase | SwiftUI, Features, DesignSystem |
| `DesignSystem` | SwiftUI, Charts | Domain, Data, Firebase |
| `Features` (app) | Domain, DesignSystem, SwiftUI | **Firebase**, Data |
| `App` (app) | tudo | — |

> Regra prática: **View nunca fala com Firebase**. View → ViewModel → Use case → Protocolo de
> repositório. Quem implementa o protocolo com Firebase é o `Data`, e quem liga os dois é o `App`.

## Estrutura de pastas

```
contas-motoboy-app-iphone/
├── MotoboyContas.xcodeproj
├── MotoboyContas/                        # target do app
│   ├── App/
│   │   ├── MotoboyContasApp.swift        # @main, FirebaseApp.configure()
│   │   ├── AppContainer.swift            # cria repositórios/use cases e injeta nas features
│   │   └── RootView.swift                # decide: login ou TabView principal
│   ├── Features/
│   │   ├── Auth/        { Views/, ViewModels/ }
│   │   ├── Today/       { Views/, ViewModels/ }   # turno atual (tela inicial)
│   │   ├── Entry/       { Views/, ViewModels/ }   # novo registro: manual e por foto
│   │   ├── Reports/     { Views/, ViewModels/ }   # dia / semana / mês, gráficos
│   │   ├── Maintenance/ { Views/, ViewModels/ }
│   │   ├── Motorcycle/  { Views/, ViewModels/ }   # minha moto + ficha sugerida pela IA
│   │   └── Settings/    { Views/, ViewModels/ }
│   └── Resources/
│       ├── Assets.xcassets
│       └── GoogleService-Info.plist      # fora do git
│
├── Packages/
│   ├── Domain/                           # Swift puro, zero dependências
│   │   ├── Sources/Domain/
│   │   │   ├── Entities/                 # Shift, Earning, Expense, Fueling, MaintenanceItem, Platform, Motorcycle
│   │   │   ├── ValueObjects/             # Money, Kilometers, DateRange
│   │   │   ├── Repositories/             # protocolos (ShiftRepository, …)
│   │   │   ├── Services/                 # protocolos de serviços externos (ReceiptExtractor, MotorcycleSpecsProvider)
│   │   │   ├── Calculators/              # ProfitCalculator, FuelCalculator, MaintenanceReserveCalculator
│   │   │   └── UseCases/                 # StartShift, AddEarning, GetPeriodSummary, …
│   │   └── Tests/DomainTests/
│   │
│   ├── Data/                             # implementações concretas
│   │   └── Sources/Data/
│   │       ├── Firestore/                # Firestore*Repository + DTOs + Mappers
│   │       ├── InMemory/                 # InMemory*Repository (dev, previews, testes)
│   │       ├── Auth/                     # FirebaseAuthService
│   │       └── AI/                       # GeminiExtractor, GeminiMotorcycleSpecsProvider (Grounding), prompts, schemas
│   │
│   └── DesignSystem/
│       └── Sources/DesignSystem/
│           ├── Tokens/                   # cores, tipografia, espaçamentos, raios
│           ├── Components/               # MCButton, MCCard, MCCurrencyField, MCStatTile…
│           └── Charts/                   # MCPieChart, MCLineChart
│
└── docs/
```

## Padrões por camada

### Domain
- **Entidades** são `struct` `Sendable`, `Equatable`, `Identifiable`.
- **Dinheiro em centavos** (`Money` envolvendo `Int`) — nunca `Double` (ADR-0007).
- **Use case** = um `struct` com uma ação, que recebe os protocolos pelo `init`:
  ```swift
  public struct AddEarning: Sendable {
      private let repository: EarningRepository
      public init(repository: EarningRepository) { self.repository = repository }

      public func callAsFunction(_ earning: Earning) async throws {
          guard earning.amount.cents > 0 else { throw DomainError.invalidAmount }
          try await repository.save(earning)
      }
  }
  ```
- **Calculadoras** são funções puras (entrada → saída), fáceis de testar.

### Data
- Cada repositório Firestore converte **DTO ↔ entidade** num `Mapper`. O formato do banco pode
  mudar sem afetar o `Domain`.
- A IA implementa o protocolo `Domain.ReceiptExtractor`; o app não sabe que é Gemini.

### Features (MVVM)
- **ViewModel**: `@Observable @MainActor final class`, recebe use cases no `init`, expõe estado
  (`isLoading`, `errorMessage`, dados formatados) e ações (`func save() async`).
- **View**: lê o ViewModel, monta com componentes do `DesignSystem`, chama ações. Sem regra de negócio.
- **Previews** usam repositórios `InMemory*` — telas desenvolvidas sem internet nem Firebase.

### DesignSystem
- Componentes reutilizáveis, sem conhecer `Domain`. Recebem valores simples (`String`, `Int`,
  `Binding`) e closures. Convenção de "props", bindings e slots em
  [componentes/README.md](./componentes/README.md).

## Fluxo de dados — lançar ganho por print

```
Usuário escolhe print do iFood (PhotosPicker)
        │
        ▼
EntryViewModel.extract(image)
        │  use case ExtractFromImage
        ▼
ReceiptExtractor (protocolo do Domain)
        │  implementado por Data/AI/GeminiExtractor
        ▼
Firebase AI Logic → Gemini (JSON estruturado)
        │
        ▼
ExtractionResult { plataforma, valor, data, confiança }
        │
        ▼
Tela "Confirmar leitura" (campos editáveis, MCCurrencyField)
        │  usuário confirma
        ▼
AddEarning (use case) ──► EarningRepository ──► Firestore users/{uid}/earnings
        │
        ▼
GetPeriodSummary recalcula → Resumo/gráficos atualizam
```

A entrada manual é o **mesmo fluxo sem as 4 primeiras etapas**.

## Referências cruzadas
- Decisões que justificam essas escolhas: [DECISOES.md](./DECISOES.md).
- Fórmulas usadas pelas calculadoras: [REGRAS-DE-NEGOCIO.md](./REGRAS-DE-NEGOCIO.md).
