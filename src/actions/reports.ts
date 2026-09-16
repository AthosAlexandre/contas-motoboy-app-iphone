/**
 * Casos de uso do Resumo: relatório de um período, lucro mês a mês e etanol × gasolina.
 */
import { repos } from '@/data/container'
import { costBreakdown, dailySeries, earningsByPlatform, type AmountSlice, type DailyPoint } from '@/domain/calculators/breakdown'
import { costPerKmCents, measuredKmPerLiter } from '@/domain/calculators/fuel'
import { summarizePeriod, type PeriodSummary } from '@/domain/calculators/profit'
import { resolveFuelPriceCents, resolveKmPerLiter } from '@/domain/calculators/shift'
import type { FuelType } from '@/domain/entities'
import { addDays, addMonths, dayRange, monthRange, weekRange, type DayRange } from '@/domain/period'

import type { DayEntries } from './entries'

export type PeriodKind = 'day' | 'week' | 'month'

export function rangeOf(kind: PeriodKind, day: string): DayRange {
  if (kind === 'day') return dayRange(day)
  return kind === 'week' ? weekRange(day) : monthRange(day)
}

/** Navega para o período anterior (-1) ou seguinte (+1). */
export function shiftDay(kind: PeriodKind, day: string, amount: number): string {
  if (kind === 'day') return addDays(day, amount)
  return kind === 'week' ? addDays(day, amount * 7) : addMonths(day, amount)
}

export interface PeriodReport {
  kind: PeriodKind
  range: DayRange
  summary: PeriodSummary
  /** De onde veio o dinheiro (por plataforma) e para onde foi (combustível, manutenção, gastos). */
  earnings: AmountSlice[]
  costs: AmountSlice[]
  /** Um ponto por dia (usado no gráfico de semana e mês). */
  daily: DailyPoint[]
  entries: DayEntries
}

/** Combustível entra pelo valor pago nos abastecimentos do período (ADR-0018). */
export async function getReport(kind: PeriodKind, day: string): Promise<PeriodReport> {
  const range = rangeOf(kind, day)
  const [shifts, earnings, expenses, fuelings] = await Promise.all([
    repos.shifts.listByDayRange(range),
    repos.earnings.listByDayRange(range),
    repos.expenses.listByDayRange(range),
    repos.fuelings.listByDayRange(range),
  ])

  const summary = summarizePeriod({ shifts, earnings, expenses, fuelings })

  return {
    kind,
    range,
    summary,
    earnings: earningsByPlatform(earnings),
    costs: costBreakdown(summary, expenses),
    daily: dailySeries(range, { shifts, earnings, expenses, fuelings }),
    entries: { earnings, expenses, fuelings },
  }
}

export interface MonthProfit {
  /** Primeiro dia do mês ('yyyy-MM-01'). */
  month: string
  netCents: number
  grossCents: number
  km: number
}

/** Lucro dos últimos meses (o mais antigo primeiro), para comparar. */
export async function getMonthlyProfits(day: string, months = 6): Promise<MonthProfit[]> {
  const result: MonthProfit[] = []

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const range = monthRange(addMonths(day, -offset))
    const [shifts, earnings, expenses, fuelings] = await Promise.all([
      repos.shifts.listByDayRange(range),
      repos.earnings.listByDayRange(range),
      repos.expenses.listByDayRange(range),
      repos.fuelings.listByDayRange(range),
    ])
    const summary = summarizePeriod({ shifts, earnings, expenses, fuelings })
    result.push({ month: range.from, netCents: summary.netProfitCents, grossCents: summary.grossCents, km: summary.km })
  }

  return result
}

export interface FuelOption {
  fuelType: FuelType
  pricePerLiterCents: number
  kmPerLiter: number | null
  /** O consumo veio da medição por tanque cheio. */
  measured: boolean
  costPerKmCents: number | null
}

export interface FuelComparison {
  options: FuelOption[]
  /** Qual compensa mais (menor R$/km); `null` se faltar consumo de algum. */
  cheaper: FuelType | null
}

export async function getFuelComparison(): Promise<FuelComparison | null> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) return null

  const [fuelings, settings] = await Promise.all([
    repos.fuelings.listByMotorcycle(motorcycle.id),
    repos.settings.get(),
  ])

  const types: FuelType[] = motorcycle.fuelSupport === 'flex' ? ['gasoline', 'ethanol'] : ['gasoline']
  const options = types.map((fuelType): FuelOption => {
    const kmPerLiter = resolveKmPerLiter(motorcycle, fuelings, fuelType)
    const pricePerLiterCents = resolveFuelPriceCents(fuelings, fuelType, settings)
    return {
      fuelType,
      pricePerLiterCents,
      kmPerLiter,
      measured: motorcycle.useMeasuredConsumption && measuredKmPerLiter(fuelings, fuelType) !== null,
      costPerKmCents: kmPerLiter === null ? null : costPerKmCents(pricePerLiterCents, kmPerLiter),
    }
  })

  const comparable = options.filter((option) => option.costPerKmCents !== null)
  const cheaper =
    comparable.length < 2
      ? null
      : comparable.reduce((best, option) => ((option.costPerKmCents ?? 0) < (best.costPerKmCents ?? 0) ? option : best))
          .fuelType

  return { options, cheaper }
}
