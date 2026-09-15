# McStatCard

Card de número: título com ícone, valor já formatado e legenda opcional. Usado nos números do dia
(tela Hoje) e, na Sprint 3, no Resumo.

Arquivo: `src/components/McStatCard.vue`

## Componente(s) Vuetify de origem
- `v-card` (+ `v-icon`)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | — | Título (obrigatório). |
| `value` | `string` | — | Valor **já formatado** (ex.: `formatMoney(...)`) (obrigatório). |
| `caption` | `string` | — | Legenda abaixo do valor. |
| `icon` | `string` | — | Ícone MDI ao lado do título. |
| `color` | `string` | `'primary'` | Token de cor do tema (ícone; fundo quando `highlight`). |
| `highlight` | `boolean` | `false` | Card tonal na cor, valor maior — destaque da tela. |

## Slots
| Slot | Descrição |
|------|-----------|
| `caption` | Substitui a legenda (conteúdo livre). |

## Exemplo
```vue
<McStatCard highlight title="Quanto guardar hoje" icon="mdi-piggy-bank-outline" :value="formatMoney(toSaveCents)" />
<McStatCard title="Gastos" icon="mdi-cash-minus" color="error" :value="formatMoney(expensesCents)" />
```
