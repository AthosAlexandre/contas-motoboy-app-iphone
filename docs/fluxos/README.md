# 🧭 Fluxos de tela

Fluxo de cada tela: o que o usuário faz, para onde vai, quais use cases a tela chama.
Um arquivo por tela quando for implementada (ex.: `hoje.md`, `novo-registro.md`).

## Navegação (rascunho)

```
Abrir app
   │
   ├─ não logado ─► Login ─► Cadastro / Esqueci a senha
   │
   ├─ logado sem moto ─► Minha moto (marca/modelo/ano) ─► Ficha sugerida (IA + fontes) ─► Plataformas
   │
   └─ logado ─► TabView
                 ├─ 🏠 Hoje          turno atual, lançamentos do dia, "quanto guardar"
                 ├─ ➕ Novo registro  [📸 Foto/print]  [✍️ Manual]
                 ├─ 📊 Resumo        dia / semana / mês, gráficos, tabela
                 ├─ 🔧 Manutenção    itens, próxima troca, reserva acumulada
                 └─ ⚙️ Ajustes       minha moto (editar/trocar), plataformas, preço do litro, conta
```

## Telas planejadas

| Tela | Feature | Sprint | Use cases principais | Doc |
|------|---------|--------|----------------------|-----|
| Login / Cadastro / Reset | `Auth` | 2 | SignIn, SignUp, ResetPassword | — |
| Hoje | `Today` | 1 | StartShift, EndShift, GetPeriodSummary(dia) | — |
| Novo registro (manual) | `Entry` | 1 | AddEarning, AddExpense, AddFueling | — |
| Novo registro (foto) → Confirmar leitura | `Entry` | 5 | ExtractFromImage + Add* | — |
| Resumo | `Reports` | 3 | GetPeriodSummary(dia/semana/mês), ListEntries | — |
| Manutenção | `Maintenance` | 4 | ListMaintenanceItems, RegisterMaintenance | — |
| Ajustes | `Settings` | 2 | UpdateSettings, ManagePlatforms | — |
| Minha moto → Ficha sugerida | `Motorcycle` | 2 (manual) / 5 (IA) | SaveMotorcycle, SwitchMotorcycle, SuggestMotorcycleSpecs | — |

## Princípio de UX
O entregador usa o app **cansado, no fim do dia, às vezes de luva**. Por isso:
- Botão de **foto/print grande** e em evidência na tela Hoje.
- No máximo **2 toques** para confirmar uma leitura da IA.
- Campos numéricos com teclado numérico e botões grandes.
