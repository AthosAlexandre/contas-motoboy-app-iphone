# McAlertBanner

Aviso dentro do app (ADR-0013 — não usamos notificação push). Hoje avisa manutenção vencida ou perto de
vencer, na tela Hoje.

Arquivo: `src/components/McAlertBanner.vue`

## Componente(s) Vuetify de origem
- `v-alert` (variante tonal)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | — | Título do aviso (obrigatório). |
| `text` | `string` | — | Explicação curta (obrigatório). |
| `type` | `'info' \| 'warning' \| 'error' \| 'success'` | `'warning'` | Cor e ícone. |
| `actionLabel` | `string` | — | Texto do botão; sem ele, o botão não aparece. |
| `to` | `RouteLocationRaw` | — | Rota do botão. Sem `to`, o clique emite `action`. |

## Eventos
| Evento | Quando dispara |
|--------|----------------|
| `action` | Clique no botão. |

## Exemplo
```vue
<McAlertBanner
  type="error"
  title="Troca de óleo vencido"
  text="Passou 100 km do intervalo."
  action-label="Ver"
  :to="{ name: 'maintenance' }"
/>
```
