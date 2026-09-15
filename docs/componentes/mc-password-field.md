# McPasswordField

Campo de senha com o botão de olho para mostrar/ocultar, sem repetir esse estado em cada tela.

Arquivo: `src/components/McPasswordField.vue`

## Componente(s) Vuetify de origem
- `v-text-field` (`type` alterna entre `password` e `text`; `append-inner-icon` com o olho)

## Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `'Senha'` | Rótulo do campo. |
| `autocomplete` | `'current-password' \| 'new-password'` | `'current-password'` | `new-password` no cadastro faz o iPhone sugerir uma senha forte. |
| _(demais)_ | — | — | Repassadas ao `v-text-field` (`prepend-inner-icon`, `hint`, `error-messages`…). |

## v-model
| Modelo | Tipo | Descrição |
|--------|------|-----------|
| `modelValue` | `string` | Senha digitada. |

## Variações tratadas
- Sem autocorreção e sem letra maiúscula automática (`autocapitalize="off"`, `spellcheck="false"`).

## Exemplo
```vue
<McPasswordField v-model="password" prepend-inner-icon="mdi-lock-outline" />
<McPasswordField v-model="password" autocomplete="new-password" hint="Pelo menos 6 caracteres" persistent-hint />
```
