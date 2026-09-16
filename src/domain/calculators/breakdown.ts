/**
 * Divisões do período para os gráficos: de onde veio o dinheiro, para onde foi e o dia a dia.
 * Devolve apenas chaves e valores — rótulos e cores são da tela.
 */
import { summarizePeriod, type PeriodSummary, type SummaryInput } from '@/domain/calculators/profit'
import type { Earning, Expense } from '@/domain/entities'
import { eachDay, type DayRange } from '@/domain/period'

export interface AmountSlice {
  /** platformId, categoria de gasto, `fuel` ou `maintenance`. */
  key: string
  cents: number
}

function sortSlices(slices: AmountSlice[]): AmountSlice[] {
  return slices.filter((slice) => slice.cents > 0).sort((a, b) => b.cents - a.cents)
}

function group<T>(items: readonly T[], keyOf: (item: T) => string, valueOf: (item: T) => number): AmountSlice[] {
  const totals = new Map<string, number>()
  for (const item of items) totals.set(keyOf(item), (totals.get(keyOf(item)) ?? 0) + valueOf(item))
  return sortSlices([...totals].map(([key, cents]) => ({ key, cents })))
}

/** Ganhos (com gorjeta) por plataforma. */
export function earningsByPlatform(earnings: readonly Earning[]): AmountSlice[] {
  return group(earnings, (earning) => earning.platformId, (earning) => earning.amountCents + earning.tipCents)
}

export function expensesByCategory(expenses: readonly Expense[]): AmountSlice[] {
  return group(expenses, (expense) => expense.category, (expense) => expense.amountCents)
}

/** Para onde foi o dinheiro: combustível, reserva de manutenção e os gastos por categoria. */
export function costBreakdown(summary: PeriodSummary, expenses: readonly Expense[]): AmountSlice[] {
  return sortSlices([
    { key: 'fuel', cents: summary.fuelCostCents },
    { key: 'maintenance', cents: summary.maintenanceReserveCents },
    ...expensesByCategory(expenses),
  ])
}

export interface DailyPoint {
  day: string
  grossCents: number
  netCents: number
  km: number
}

/** Um ponto por dia do período (dias sem movimento entram zerados). */
export function dailySeries(range: DayRange, input: SummaryInput): DailyPoint[] {
  const fuelings = input.fuelings ?? []
  return eachDay(range).map((day) => {
    const summary = summarizePeriod({
      shifts: input.shifts.filter((shift) => shift.day === day),
      earnings: input.earnings.filter((earning) => earning.day === day),
      expenses: input.expenses.filter((expense) => expense.day === day),
      fuelings: fuelings.filter((fueling) => fueling.day === day),
    })
    return { day, grossCents: summary.grossCents, netCents: summary.netProfitCents, km: summary.km }
  })
}
