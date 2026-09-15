/**
 * Dados de referência para as telas: plataformas, moto ativa e o contexto de combustível.
 */
import { repos } from '@/data/container'
import { measuredKmPerLiter } from '@/domain/calculators/fuel'
import { resolveFuelPriceCents, resolveFuelType, resolveKmPerLiter } from '@/domain/calculators/shift'
import type { FuelType, Motorcycle, Platform } from '@/domain/entities'

export async function listActivePlatforms(): Promise<Platform[]> {
  return (await repos.platforms.list()).filter((platform) => platform.isActive)
}

export async function getActiveMotorcycle(): Promise<Motorcycle | null> {
  return repos.motorcycles.getActive()
}

/** O que será usado no cálculo do próximo encerramento de turno. */
export interface FuelContext {
  fuelType: FuelType
  kmPerLiter: number | null
  /** O consumo vem da medição por tanque cheio (e não da ficha). */
  measured: boolean
  pricePerLiterCents: number
}

export async function getFuelContext(): Promise<FuelContext | null> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) return null

  const [fuelings, settings] = await Promise.all([
    repos.fuelings.listByMotorcycle(motorcycle.id),
    repos.settings.get(),
  ])
  const fuelType = resolveFuelType(motorcycle, fuelings)

  return {
    fuelType,
    kmPerLiter: resolveKmPerLiter(motorcycle, fuelings, fuelType),
    measured: motorcycle.useMeasuredConsumption && measuredKmPerLiter(fuelings, fuelType) !== null,
    pricePerLiterCents: resolveFuelPriceCents(fuelings, fuelType, settings),
  }
}
