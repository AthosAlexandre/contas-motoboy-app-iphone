# McNumberField

Campo numérico para km e litros. Aceita vírgula ou ponto e limita as casas decimais.

Arquivo: `src/components/McNumberField.vue`

## Componente(s) Vuetify de origem
- `v-text-field` (`inputmode="numeric"` sem decimais, `inputmode="decimal"` com decimais)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | — | Rótulo do campo. |
| `suffix` | `string` | — | Unidade exibida no fim (`km`, `l`). |
| `decimals` | `number` | `0` | Casas decimais permitidas (`0` = só inteiros). |
| _(demais)_ | — | — | Repassadas ao `v-text-field` (`hint`, `persistent-hint`, `error-messages`…). |

## v-model
| Modelo | Tipo | Descrição |
|--------|------|-----------|
| `modelValue` | `number \| null` | Número digitado. `null` = vazio **ou inválido** (ex.: "8,1234" com `decimals=3`). |

## Variações tratadas
- "8,437" e "8.437" → `8.437`.
- Valor alterado por fora (formulário limpo) atualiza o texto do campo.

## Exemplo
```vue
<McNumberField v-model="liters" label="Litros colocados" suffix="l" :decimals="3" />
<McNumberField v-model="kmEnd" label="Km final (odômetro)" suffix="km" :error-messages="kmEndError" />
```
