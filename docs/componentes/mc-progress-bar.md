# McProgressBar

Barra de progresso com faixas, usada em **Manutenção** para mostrar quanto falta até a próxima troca.

Arquivo: `src/components/McProgressBar.vue`

## Componente(s) Vuetify de origem
- `v-progress-linear`

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | — | Texto à esquerda (ex.: "700 km rodados") (obrigatório). |
| `ratio` | `number` | — | 0 = acabou de trocar · 1 = chegou no intervalo · >1 = passou (obrigatório). |
| `hint` | `string` | — | Texto à direita (ex.: "faltam 300 km") (obrigatório). |
| `state` | `'ok' \| 'warning' \| 'overdue'` | — | Define a cor: primary, warning e error (obrigatório). |

## Variações tratadas
- `ratio` acima de 1 preenche a barra até 100% e fica vermelha; abaixo de 0 vira 0.
- A cor vale também para o texto da direita, então o aviso se lê sem depender só da cor da barra.

## Exemplo
```vue
<McProgressBar
  :label="`${formatKm(status.kmSince)} rodados`"
  :ratio="status.ratio"
  :hint="`faltam ${formatKm(status.kmLeft)}`"
  :state="status.state"
/>
```
