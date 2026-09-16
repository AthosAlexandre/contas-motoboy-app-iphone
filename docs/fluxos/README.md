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
   └─ logado ─► AppLayout (barra de navegação inferior)
                 ├─ 🏠 Hoje          turno atual, lançamentos do dia, "quanto guardar"
                 ├─ ➕ Novo registro  [📸 Foto/print]  [✍️ Manual]
                 ├─ 📊 Resumo        dia / semana / mês, gráficos, tabela
                 ├─ 🔧 Manutenção    itens, próxima troca, reserva acumulada
                 └─ ⚙️ Ajustes       minha moto (editar/trocar), plataformas, preço do litro, conta
```

## Telas planejadas

| Tela | Feature | Sprint | Use cases principais | Doc |
|------|---------|--------|----------------------|-----|
| Entrar / Criar conta / Esqueci a senha | `auth` | 2 ✅ | signIn, signUp, sendPasswordReset | [conta.md](./conta.md) |
| Hoje | `today` | 1 ✅ | startShift, endShift, getPeriodSummary(dia), listEntries, removeEntry | [hoje.md](./hoje.md) |
| Novo registro (manual) | `entry` | 1 ✅ | addEarning, addExpense, addFueling | [novo-registro.md](./novo-registro.md) |
| Novo registro (foto) → Confirmar leitura | `Entry` | 5 | ExtractFromImage + Add* | — |
| Resumo | `reports` | 3 ✅ | getReport(dia/semana/mês), getMonthlyProfits, getFuelComparison, update/removeEntry | [resumo.md](./resumo.md) |
| Manutenção | `Maintenance` | 4 | ListMaintenanceItems, RegisterMaintenance | — |
| Ajustes | `settings` | 2 ✅ | getSettings, saveSettings, addPlatform, setPlatformActive, signOut | [ajustes.md](./ajustes.md) |
| Minha moto → Ficha sugerida | `motorcycle` | 2 ✅ (manual) / 5 (IA) | registerMotorcycle, updateMotorcycle, getMeasuredConsumption | [minha-moto.md](./minha-moto.md) |

## Princípio de UX
O entregador usa o app **cansado, no fim do dia, às vezes de luva**. Por isso:
- Botão de **foto/print grande** e em evidência na tela Hoje.
- No máximo **2 toques** para confirmar uma leitura da IA.
- Campos numéricos com teclado numérico e botões grandes.
- **Mobile-first:** respeitar as safe areas do iPhone (notch e barra inferior); alvo de toque ≥ 48 px.
- **Avisos dentro do app** (manutenção vencendo, turno em aberto): banner na tela Hoje e badge na
  aba Manutenção — sem push (ADR-0013).
