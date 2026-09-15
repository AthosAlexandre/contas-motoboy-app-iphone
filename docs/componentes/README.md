# 🧩 Componentes (`Packages/DesignSystem`)

Componentes **reutilizáveis** do app, criados **sob demanda** (só encapsulamos o que de fato
usamos). Mesma ideia dos wrappers `Mm*` do MegaMente: o SwiftUI dá peças cruas (`Button`,
`TextField`, `Chart`…) e nós criamos componentes com o visual e o comportamento padrão do app.

## "Props" no SwiftUI — equivalências com Vue

| Vue | SwiftUI | Exemplo |
|-----|---------|---------|
| `props` | parâmetros do `init` (`let`) | `MCStatTile(title: "Lucro", value: "R$ 152,30")` |
| `withDefaults` | valor padrão no `init` | `style: MCButtonStyle = .primary` |
| `v-model` / `defineModel` | `@Binding` | `MCCurrencyField("Valor", cents: $amount)` |
| `emit('click')` | closure | `MCButton("Salvar") { save() }` |
| `<slot />` | `@ViewBuilder` | `MCCard { Text("conteúdo") }` |
| slot nomeado | vários `@ViewBuilder` | `MCCard { … } header: { … }` |
| variantes (`variant="outlined"`) | `enum` + `ButtonStyle`/`ViewModifier` | `.mcButtonStyle(.secondary)` |
| tema (`color="primary"`) | tokens do DesignSystem | `MCColor.primary`, `MCSpacing.md` |
| `provide/inject` | `@Environment` | tema, formatador de moeda |

## Regras

- **Prefixo `MC`** (MotoboyContas). Ex: `MCButton`, `MCCurrencyField`.
- **Nunca cor/tamanho "solto"** — usar tokens (`MCColor`, `MCFont`, `MCSpacing`, `MCRadius`).
  Suportar modo claro e escuro.
- **Componente não conhece o `Domain`**: recebe `String`, `Int`, `Binding`, closures. Quem
  converte `Earning` → texto é o ViewModel. Assim o componente serve para qualquer tela.
- **Sem estado de negócio** dentro do componente; `@State` só para estado visual (foco, expandido).
- **Acessibilidade**: `accessibilityLabel` onde o texto não basta; respeitar Dynamic Type.
- **Todo componente tem `#Preview`** com as variações principais.
- **Um componente = um arquivo `.swift`** em `Components/` (ou `Charts/`) **+ um `.md`** aqui.

## Template de documentação de componente

Cada componente tem um arquivo `mc-<nome>.md`:

````
# MCNome

Breve descrição / quando usar.

## Base SwiftUI
- `TextField` (+ combinações)

## Parâmetros (props)
| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|

## Bindings
| Binding | Tipo | Descrição |

## Slots (@ViewBuilder)
| Slot | Descrição |

## Ações (closures)
| Closure | Quando dispara |

## Variações tratadas
- ...

## Exemplo
```swift
MCNome(...)
```
````

## Índice de componentes

> Atualizar conforme forem criados. Planejados para as Sprints 1, 3 e 4.

| Componente | Base SwiftUI | Sprint | Doc |
|------------|--------------|--------|-----|
| `MCButton` | `Button` + `ButtonStyle` (primary, secondary, destructive; loading) | 1 | — |
| `MCCard` | `VStack` + fundo/raio/sombra; slots conteúdo e header | 1 | — |
| `MCCurrencyField` | `TextField` com máscara R$ → `Binding<Int>` (centavos) | 1 | — |
| `MCNumberField` | `TextField` numérico (km, litros) com sufixo | 1 | — |
| `MCSegmentedPicker` | `Picker(.segmented)` genérico | 1 | — |
| `MCStatTile` | card com título, valor, variação (↑/↓) | 3 | — |
| `MCPieChart` | `Chart` + `SectorMark` | 3 | — |
| `MCLineChart` | `Chart` + `LineMark`/`AreaMark` | 3 | — |
| `MCProgressBar` | barra com faixas de alerta (ok/atenção/vencido) | 4 | — |
| `MCEmptyState` | ícone + texto + ação | 6 | — |
| `MCSourceList` | lista de fontes (título + link) exigida pelo Grounding | 5 | — |
| `MCSearchSuggestions` | `WKWebView` com o HTML de sugestões de busca do Google | 5 | — |
