# McPieChart

Gráfico de **rosca** com legenda (valor e porcentagem). Usado no Resumo em "De onde veio o dinheiro" e
"Para onde foi". Desenhado em SVG, sem biblioteca de gráficos (ADR-0017).

Arquivo: `src/components/McPieChart.vue`

## Base
- SVG puro. Circunferência = 100 (raio 15,915), então cada fatia usa a própria porcentagem em
  `stroke-dasharray`. No meio da rosca aparece o total.

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `slices` | `{ key, label, value, color }[]` | — | Fatias já prontas: rótulo e cor vêm da tela (obrigatório). |
| `formatValue` | `(value: number) => string` | — | Formata o valor, ex.: `formatMoney` (obrigatório). |
| `caption` | `string` | — | Texto pequeno abaixo do total ("ganhos", "custos"). |
| `emptyText` | `string` | `'Sem dados neste período.'` | Mensagem quando o total é zero. |

## Variações tratadas
- Total zero → mostra só a mensagem.
- Porcentagem calculada sozinha; legenda corta nomes longos com reticências.

## Acessibilidade
- `role="img"` e `aria-label` com todas as fatias e valores.

## Exemplo
```vue
<McPieChart
  :slices="[{ key: 'ifood', label: 'iFood', value: 15000, color: 'rgb(var(--v-theme-primary))' }]"
  :format-value="formatMoney"
  caption="ganhos"
/>
```
