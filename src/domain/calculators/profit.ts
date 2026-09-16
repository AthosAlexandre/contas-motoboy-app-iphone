/**
 * Resumo de um período (dia, semana, mês) — ver docs/REGRAS-DE-NEGOCIO.md (Lucro, Métricas,
 * Quanto guardar).
 *
 * Combustível entra pelo **valor pago** no abastecimento, no dia do lançamento (ADR-0018). O custo
 * estimado por km continua sendo calculado, mas só como indicador — não entra no lucro.
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
  /** Abastecimentos pagos no período. */
  fuelCostCents: number
  /** Indicador: quanto o combustível teria custado pelo consumo × km (snapshot dos turnos). */
  estimatedFuelCostCents: number
  maintenanceReserveCents: number
  operatingProfitCents: number
  netProfitCents: number
  /** Dinheiro a guardar: a reserva de manutenção (o combustível já foi pago). */
  toSaveCents: number
  /** R$/km e lucro/km em centavos com fração; `null` sem km rodado. */
  grossPerKmCents: number | null
  netPerKmCents: number | null
  /** Algum turno encerrado sem consumo informado → a estimativa por km ficou incompleta. */
  missingConsumption: boolean
}

export interface SummaryInput {
  shifts: readonly Shift[]
  earnings: readonly Earning[]
  expenses: readonly Expense[]
  fuelings?: readonly Fueling[]
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function summarizePeriod(input: SummaryInput): PeriodSummary {
  const { shifts, earnings, expenses, fuelings = [] } = input
  const closed = shifts.filter((shift) => shift.snapshot !== null && shiftKm(shift) !== null)

  const km = sum(closed, (shift) => shiftKm(shift) ?? 0)
  const grossCents = sum(earnings, (earning) => earning.amountCents + earning.tipCents)
  const expensesCents = sum(expenses, (expense) => expense.amountCents)
  const fuelCostCents = sum(fuelings, (fueling) => fueling.totalCents)
  const estimatedFuelCostCents = sum(closed, (shift) => shift.snapshot?.fuelCostCents ?? 0)
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
    estimatedFuelCostCents,
    maintenanceReserveCents,
    operatingProfitCents,
    netProfitCents,
    toSaveCents: maintenanceReserveCents,
    grossPerKmCents: km > 0 ? grossCents / km : null,
    netPerKmCents: km > 0 ? netProfitCents / km : null,
    missingConsumption: closed.some((shift) => shift.snapshot?.fuelCostCents === null),
  }
}
