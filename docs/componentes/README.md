# 🧩 Componentes (`src/components`)

Componentes **wrapper reaproveitáveis** do MotoboyContas, criados **sob demanda** (não copiamos
todos os componentes do Vuetify — só encapsulamos o que de fato usamos). Mesma ideia do MegaMente:

1. O Vuetify oferece componentes crus (`v-btn`, `v-text-field`, `v-data-table`...), cada um com **muitas variações**.
2. Criamos um **componente próprio** que encapsula um (ou vários) componentes Vuetify, com o visual e o comportamento padrão do app.
3. As variações necessárias ficam **tratadas via props** do wrapper, sem repetir configuração pelo app.

## Regras

- **Prefixo `Mc`** (MotoboyContas). Ex: `McCurrencyField`, `McStatCard`. Evita colisão com `v-*`.
- **Nunca hex hardcoded** — usar tokens do tema (`color="primary"`), definidos em
  `src/plugins/vuetify.ts`, com **tema claro e escuro**.
- **Props tipadas** com `defineProps<...>()` + `withDefaults`; **v-model** com `defineModel`.
- **Repasse** de props/slots ao Vuetify quando fizer sentido (`v-bind="$attrs"`, `<slot />`).
- **Não conhecem o domínio**: recebem valores simples (`string`, `number`, `boolean`) e emitem
  eventos. Quem transforma um `Fueling` em texto é a page/hook. Assim o componente serve em qualquer tela.
- **Mobile-first**: alvo de toque ≥ 48 px; teclado certo (`inputmode="decimal"` para dinheiro e
  litros, `inputmode="numeric"` para km).
- **Um componente = um arquivo `.vue`** em `src/components/` **+ um `.md`** aqui.

## Efeito vidro

O Liquid Glass nativo do iOS não existe na web (ADR-0011). Usamos a classe utilitária **`.mc-glass`**
(em `src/assets/styles/main.css`): fundo translúcido + `backdrop-filter: blur() saturate()` + borda
sutil, com fallback opaco quando o navegador não suporta. **Com moderação**: barra de navegação
inferior, cabeçalho e cards de destaque.

## Template de documentação de componente

Cada componente tem um arquivo `mc-<nome>.md`:

````
# McNome

Breve descrição / quando usar.

## Componente(s) Vuetify de origem
- v-xxx (+ combinações)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|

## v-model
| Modelo | Tipo | Descrição |

## Slots
| Slot | Descrição |

## Eventos
| Evento | Payload | Quando dispara |

## Variações tratadas
- ...

## Exemplo
```vue
<McNome ... />
```
````

## Índice de componentes

> Atualizar conforme forem criados. Planejados:

| Componente | Origem Vuetify | Sprint | Doc |
|------------|----------------|--------|-----|
| `McCurrencyField` | `v-text-field` com máscara R$ → v-model em **centavos** (`number`) | 1 ✅ | [mc-currency-field.md](./mc-currency-field.md) |
| `McNumberField` | `v-text-field` numérico (km, litros) com sufixo | 1 ✅ | [mc-number-field.md](./mc-number-field.md) |
| `McFuelTypeToggle` | `v-btn-toggle` gasolina/etanol (prop `allowEthanol` para moto não flex) | 1 ✅ | [mc-fuel-type-toggle.md](./mc-fuel-type-toggle.md) |
| `McStatCard` | `v-card` com título, valor e legenda; `highlight` tonal | 1 ✅ | [mc-stat-card.md](./mc-stat-card.md) |
| `McPasswordField` | `v-text-field` de senha com mostrar/ocultar | 2 ✅ | [mc-password-field.md](./mc-password-field.md) |
| `McPeriodPicker` | `v-btn-toggle` dia/semana/mês + navegação ‹ › | 3 ✅ | [mc-period-picker.md](./mc-period-picker.md) |
| `McPieChart` | SVG próprio (rosca), sem biblioteca — ADR-0017 | 3 ✅ | [mc-pie-chart.md](./mc-pie-chart.md) |
| `McLineChart` | SVG próprio (linha + área), sem biblioteca — ADR-0017 | 3 ✅ | [mc-line-chart.md](./mc-line-chart.md) |
| `McProgressBar` | `v-progress-linear` com faixas ok/atenção/vencido | 4 ✅ | [mc-progress-bar.md](./mc-progress-bar.md) |
| `McAlertBanner` | `v-alert` para avisos dentro do app (ADR-0013) | 4 ✅ | [mc-alert-banner.md](./mc-alert-banner.md) |
| `McImagePicker` | `v-btn` + `<input type="file" accept="image/*">` + redimensionamento | 5 | — |
| `McSourceList` | `v-list` com as fontes (título + link) exigidas pelo Grounding | 5 | — |
| `McSearchSuggestions` | `iframe` `srcdoc` isolado com o HTML de sugestões de busca do Google | 5 | — |
| `McEmptyState` | `v-empty-state` | 6 | — |
