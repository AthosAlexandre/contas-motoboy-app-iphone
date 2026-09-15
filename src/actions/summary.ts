/**
 * Resumo de um período (dia, semana, mês).
 */
import { repos } from '@/data/container'
import { summarizePeriod, type PeriodSummary, type SummaryInput } from '@/domain/calculators/profit'
import type { DayRange } from '@/domain/period'

export async function getPeriodSummary(
  range: DayRange,
  fuelCostMode: SummaryInput['fuelCostMode'] = 'estimated',
): Promise<PeriodSummary> {
  const [shifts, earnings, expenses, fuelings] = await Promise.all([
    repos.shifts.listByDayRange(range),
    repos.earnings.listByDayRange(range),
    repos.expenses.listByDayRange(range),
    repos.fuelings.listByDayRange(range),
  ])
  return summarizePeriod({ shifts, earnings, expenses, fuelings, fuelCostMode })
}
