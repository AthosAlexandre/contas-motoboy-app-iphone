# Resumo (`/resumo`)

Arquivo: `src/pages/reports/ReportsPage.vue` · casos de uso: `src/actions/reports.ts`.

## O que o usuário faz
1. Escolhe **Dia | Semana | Mês** (`McPeriodPicker`) e navega com ‹ ›. A seta da direita não passa do
   período atual; quando sai dele, aparece **Voltar para hoje**.
2. Vê os números do período:
   - **Lucro líquido** em destaque, com a conta resumida na legenda;
   - ganhos, gastos, combustível, reserva de manutenção, km e R$/km (com lucro por km).
3. **De onde veio o dinheiro** — rosca por plataforma.
4. **Para onde foi** — rosca com combustível, reserva de manutenção e os gastos por categoria.
5. **Lucro por dia** (semana e mês) — linha, com a média por dia trabalhado.
6. **Lucro de cada mês** (só no modo Mês) — linha dos últimos 6 meses + lista com os valores.
7. **Etanol ou gasolina?** — R$/km de cada combustível, com o preço e o consumo da moto; o que compensa
   ganha o selo "compensa". Aparece só em moto flex.
8. **Lançamentos do período** — lista com **editar** (diálogo) e **excluir** (pede confirmação).

## Regras visíveis
- O **combustível é o valor pago** nos abastecimentos do período, igual em dia, semana e mês (ADR-0018).
  O card mostra também a **estimativa por km** como indicador.
- Dias sem movimento entram zerados no gráfico.
- Aviso quando algum turno do período ficou sem consumo informado.
- Editar um abastecimento **recalcula o preço por litro**.

## Consome / dispara
- `actions/reports`: `getReport`, `getMonthlyProfits`, `getFuelComparison`, `rangeOf`, `shiftDay`.
- `actions/entries`: `updateEarning`, `updateExpense`, `updateFueling`, `removeEntry`.
- `actions/settings`: `listAllPlatforms` (nomes das plataformas, inclusive as desativadas).

## Desempenho
- O comparativo mês a mês lê 6 períodos, então só carrega no modo **Mês**.
