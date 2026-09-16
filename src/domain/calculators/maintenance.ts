/**
 * Manutenção — ver docs/REGRAS-DE-NEGOCIO.md (Reserva de manutenção, Próxima manutenção).
 */
import type { MaintenanceItem } from '@/domain/entities'
import { daysBetween } from '@/domain/period'

export interface MaintenanceCost {
  estimatedCostCents: number
  intervalKm: number
}

/** Soma do custo por km (centavos, com fração) de todos os itens de manutenção. */
export function reservePerKmCents(items: readonly MaintenanceCost[]): number {
  return items
    .filter((item) => item.intervalKm > 0 && item.estimatedCostCents > 0)
    .reduce((total, item) => total + item.estimatedCostCents / item.intervalKm, 0)
}

/** Quanto reservar (centavos inteiros) para `km` rodados. */
export function maintenanceReserveCents(km: number, perKmCents: number): number {
  if (km <= 0 || perKmCents <= 0) return 0
  return Math.round(km * perKmCents)
}

/** A partir de 90% do intervalo o item entra em atenção. */
export const WARNING_RATIO = 0.9

export type MaintenanceState = 'ok' | 'warning' | 'overdue'

export interface MaintenanceStatus {
  kmSince: number
  /** Quanto falta (negativo = passou do ponto). */
  kmLeft: number
  daysSince: number
  daysLeft: number | null
  /** 0 a 1+ — o que estiver mais adiantado entre km e tempo. */
  ratio: number
  state: MaintenanceState
}

/** Situação de um item: vence pelo que chegar primeiro, km ou tempo. */
export function maintenanceStatus(item: MaintenanceItem, odometerKm: number, today: string): MaintenanceStatus {
  const kmSince = Math.max(0, odometerKm - item.lastKm)
  const kmLeft = item.intervalKm - kmSince
  const ratioKm = item.intervalKm > 0 ? kmSince / item.intervalKm : 0

  const daysSince = Math.max(0, daysBetween(item.lastDate, today))
  const daysLeft = item.intervalDays === null ? null : item.intervalDays - daysSince
  const ratioDays = item.intervalDays && item.intervalDays > 0 ? daysSince / item.intervalDays : 0

  const ratio = Math.max(ratioKm, ratioDays)

  return {
    kmSince,
    kmLeft,
    daysSince,
    daysLeft,
    ratio,
    state: ratio >= 1 ? 'overdue' : ratio >= WARNING_RATIO ? 'warning' : 'ok',
  }
}

/** Mais urgente primeiro (maior `ratio`). */
export function byUrgency<T extends { status: MaintenanceStatus }>(a: T, b: T): number {
  return b.status.ratio - a.status.ratio
}
