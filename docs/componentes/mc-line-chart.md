# McLineChart

Gráfico de **linha com área**, usado no Resumo para o lucro por dia (semana/mês) e para o lucro de cada
mês. Desenhado em SVG, sem biblioteca de gráficos (ADR-0017).

Arquivo: `src/components/McLineChart.vue`

## Base
- SVG (`polyline` + `polygon` da área). A escala vertical sempre inclui o **zero**; havendo valor
  negativo, a linha do zero aparece tracejada. `vector-effect="non-scaling-stroke"` mantém a espessura
  da linha mesmo com o gráfico esticado na largura.

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `points` | `{ label, value }[]` | — | Pontos na ordem (obrigatório). |
| `formatValue` | `(value: number) => string` | — | Formata o valor, ex.: `formatMoney` (obrigatório). |
| `color` | `string` | `primary` do tema | Cor da linha e da área. |
| `highlight` | `string` | — | Texto curto no canto superior direito (ex.: "média por dia trabalhado: R$ 120,00"). |
| `emptyText` | `string` | `'Sem dados suficientes para o gráfico.'` | Mensagem com menos de 2 pontos. |

## Variações tratadas
- Todos os valores zerados → linha reta no zero.
- Rótulos do primeiro e do último ponto aparecem embaixo; o maior valor, em cima à esquerda.

## Acessibilidade
- `role="img"` e `aria-label` com todos os pontos e valores.

## Exemplo
```vue
<McLineChart :points="dailyPoints" :format-value="formatMoney" :highlight="dailyAverage" />
```
