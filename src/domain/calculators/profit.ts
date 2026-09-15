/**
 * Resumo de um período (dia, semana, mês) — ver docs/REGRAS-DE-NEGOCIO.md (Lucro, Métricas,
 * Quanto guardar).
 */
import type { Earning, Expense, Fueling, Shift } from '@/domain/entities'
import { shiftKm } from '@/domain/calculators/shift'

export interface PeriodSummary {
  km: number
  closedShifts: number
  openShifts: number
  /** Ganhos + gorjetas. */
  grossCents: number
  /** Gastos diretos (sem combustível e sem manutenção). */
  expensesCents: number
  fuelCostCents: number
  maintenanceReserveCents: number
  operatingProfitCents: number
  netProfitCents: number
  /** Combustível + reserva de manutenção. */
  toSaveCents: number
  /** R$/km e lucro/km em centavos com fração; `null` sem km rodado. */
  grossPerKmCents: number | null
  netPerKmCents: number | null
  /** Algum turno encerrado sem consumo informado → combustível ficou de fora. */
  missingConsumption: boolean
}

export interface SummaryInput {
  shifts: readonly Shift[]
  earnings: readonly Earning[]
  expenses: readonly Expense[]
  fuelings?: readonly Fueling[]
  /**
   * `estimated` (padrão): combustível pelo snapshot de cada turno (km ÷ consumo × preço).
   * `real`: soma dos abastecimentos do período — usado nos resumos mensais.
   */
  fuelCostMode?: 'estimated' | 'real'
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function summarizePeriod(input: SummaryInput): PeriodSummary {
  const { shifts, earnings, expenses, fuelings = [], fuelCostMode = 'estimated' } = input
  const closed = shifts.filter((shift) => shift.snapshot !== null && shiftKm(shift) !== null)

  const km = sum(closed, (shift) => shiftKm(shift) ?? 0)
  const grossCents = sum(earnings, (earning) => earning.amountCents + earning.tipCents)
  const expensesCents = sum(expenses, (expense) => expense.amountCents)
  const fuelCostCents =
    fuelCostMode === 'real'
      ? sum(fuelings, (fueling) => fueling.totalCents)
      : sum(closed, (shift) => shift.snapshot?.fuelCostCents ?? 0)
  const maintenanceReserveCents = sum(closed, (shift) => shift.snapshot?.maintenanceReserveCents ?? 0)

  const operatingProfitCents = grossCents - fuelCostCents - expensesCents
  const netProfitCents = operatingProfitCents - maintenanceReserveCents

  return {
    km,
    closedShifts: closed.length,
    openShifts: shifts.filter((shift) => shift.endedAt === null).length,
    grossCents,
    expensesCents,
    fuelCostCents,
    maintenanceReserveCents,
    operatingProfitCents,
    netProfitCents,
    toSaveCents: fuelCostCents + maintenanceReserveCents,
    grossPerKmCents: km > 0 ? grossCents / km : null,
    netPerKmCents: km > 0 ? netProfitCents / km : null,
    missingConsumption: fuelCostMode === 'estimated' && closed.some((shift) => shift.snapshot?.fuelCostCents === null),
  }
}
