# McPeriodPicker

Seletor de período do Resumo: **Dia | Semana | Mês**, com navegação ‹ › e atalho para voltar ao período
atual.

Arquivo: `src/components/McPeriodPicker.vue`

## Componente(s) Vuetify de origem
- `v-btn-toggle` (mandatory) + `v-btn` de ícone

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `kind` | `'day' \| 'week' \| 'month'` | — | Período selecionado (obrigatório). |
| `label` | `string` | — | Período já formatado: "15/09", "14 a 20/09", "Setembro de 2026" (obrigatório). |
| `isCurrent` | `boolean` | — | Se o período contém hoje: desabilita a seta da direita e esconde o atalho (obrigatório). |

## Eventos
| Evento | Quando dispara |
|--------|----------------|
| `update:kind` | Trocou entre Dia/Semana/Mês. |
| `previous` | Seta ‹ (período anterior). |
| `next` | Seta › (próximo período). |
| `now` | "Voltar para hoje". |

## Variações tratadas
- Não avança para o futuro: com `isCurrent`, a seta da direita fica desabilitada.

## Exemplo
```vue
<McPeriodPicker
  :kind="kind"
  :label="periodLabel"
  :is-current="isCurrentPeriod"
  @update:kind="onKind"
  @previous="onShift(-1)"
  @next="onShift(1)"
  @now="onNow"
/>
```
