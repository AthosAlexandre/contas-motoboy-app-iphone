# McCurrencyField

Campo de dinheiro no estilo app de banco: a pessoa digita só números e os centavos vão se formando
(`1` → 0,01 · `14590` → 145,90). Evita procurar vírgula no teclado do celular.

Arquivo: `src/components/McCurrencyField.vue`

## Componente(s) Vuetify de origem
- `v-text-field` (prefixo `R$`, `inputmode="numeric"`, `autocomplete="off"`)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | — | Rótulo do campo. |
| `maxCents` | `number` | `99_999_999` | Limite (R$ 999.999,99). |
| _(demais)_ | — | — | Repassadas ao `v-text-field` (`hint`, `error-messages`, `density`, `class`…). |

## v-model
| Modelo | Tipo | Descrição |
|--------|------|-----------|
| `modelValue` | `number \| null` | Centavos inteiros. `null` = campo vazio. |

## Variações tratadas
- Apagar tudo → `null`.
- Colar "R$ 145,90" → só os dígitos contam → `14590`.

## Limitações conhecidas
- O cursor fica sempre no fim (o texto é reformatado a cada tecla).

## Exemplo
```vue
<McCurrencyField v-model="amountCents" label="Valor recebido" />
```
