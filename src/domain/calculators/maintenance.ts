/**
 * Reserva de manutenção — ver docs/REGRAS-DE-NEGOCIO.md (Reserva de manutenção).
 */

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
