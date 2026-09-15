# McFuelTypeToggle

Escolha do combustível do abastecimento: Gasolina ou Etanol. Não importa o domínio — trabalha com as
strings `'gasoline' | 'ethanol'`.

Arquivo: `src/components/McFuelTypeToggle.vue`

## Componente(s) Vuetify de origem
- `v-btn-toggle` (`mandatory`, `divided`) + 2 `v-btn`

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `allowEthanol` | `boolean` | `true` | `false` desabilita Etanol (moto que não é flex). |

## v-model
| Modelo | Tipo | Descrição |
|--------|------|-----------|
| `modelValue` | `'gasoline' \| 'ethanol'` | Obrigatório. |

## Exemplo
```vue
<McFuelTypeToggle v-model="fuelType" :allow-ethanol="motorcycle?.fuelSupport === 'flex'" />
```
