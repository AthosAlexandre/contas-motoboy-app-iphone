/**
 * Turno: km rodados e o snapshot gravado ao encerrar (ADR-0009).
 */
import type { FuelType, Fueling, Motorcycle, Settings, Shift, ShiftSnapshot } from '@/domain/entities'
import { fuelCostCents, latestFueling, measuredKmPerLiter } from '@/domain/calculators/fuel'
import { maintenanceReserveCents } from '@/domain/calculators/maintenance'

/** Acima disso o app pede para conferir o km final (não bloqueia). */
export const LONG_SHIFT_KM = 500

/** Km rodados no turno; `null` se o turno está aberto ou o km final é menor que o inicial. */
export function shiftKm(shift: Pick<Shift, 'kmStart' | 'kmEnd'>): number | null {
  if (shift.kmEnd === null || shift.kmEnd < shift.kmStart) return null
  return shift.kmEnd - shift.kmStart
}

/** Combustível no tanque: o do último abastecimento (etanol só se a moto for flex); senão gasolina. */
export function resolveFuelType(motorcycle: Motorcycle, fuelings: readonly Fueling[]): FuelType {
  const last = latestFueling(fuelings)
  if (last?.fuelType === 'ethanol' && motorcycle.fuelSupport === 'flex') return 'ethanol'
  return 'gasoline'
}

/** Consumo usado: o medido (se a moto usa e existe) ou o da ficha. `null` = não informado. */
export function resolveKmPerLiter(
  motorcycle: Motorcycle,
  fuelings: readonly Fueling[],
  fuelType: FuelType,
): number | null {
  if (motorcycle.useMeasuredConsumption) {
    const measured = measuredKmPerLiter(fuelings, fuelType)
    if (measured !== null) return measured
  }
  const fromSpecs = fuelType === 'gasoline' ? motorcycle.kmPerLiterGasoline : motorcycle.kmPerLiterEthanol
  return fromSpecs !== null && fromSpecs > 0 ? fromSpecs : null
}

/** Preço por litro: o do último abastecimento daquele combustível, senão o padrão dos Ajustes. */
export function resolveFuelPriceCents(fuelings: readonly Fueling[], fuelType: FuelType, settings: Settings): number {
  const last = latestFueling(fuelings, fuelType)
  if (last) return last.pricePerLiterCents
  return fuelType === 'gasoline' ? settings.defaultGasolinePriceCents : settings.defaultEthanolPriceCents
}

export interface SnapshotInput {
  km: number
  motorcycle: Motorcycle
  /** Abastecimentos da moto até o fim do turno. */
  fuelings: readonly Fueling[]
  settings: Settings
  /** Custo por km dos itens de manutenção (Sprint 4). Sem itens → `settings.maintenanceReservePer100KmCents`. */
  maintenanceReservePerKmCents?: number
}

export function buildShiftSnapshot(input: SnapshotInput): ShiftSnapshot {
  const { km, motorcycle, fuelings, settings } = input
  const fuelTypeUsed = resolveFuelType(motorcycle, fuelings)
  const kmPerLiterUsed = resolveKmPerLiter(motorcycle, fuelings, fuelTypeUsed)
  const fuelPriceCentsUsed = resolveFuelPriceCents(fuelings, fuelTypeUsed, settings)
  const perKmCents = input.maintenanceReservePerKmCents ?? settings.maintenanceReservePer100KmCents / 100

  return {
    fuelTypeUsed,
    kmPerLiterUsed,
    fuelPriceCentsUsed,
    fuelCostCents: kmPerLiterUsed === null ? null : fuelCostCents(km, kmPerLiterUsed, fuelPriceCentsUsed),
    maintenanceReserveCents: maintenanceReserveCents(km, perKmCents),
  }
}
