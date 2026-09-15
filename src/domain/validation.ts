/**
 * Validação e normalização de cadastros: moto, Ajustes, plataformas e credenciais.
 */
import type { FuelSupport, Settings } from '@/domain/entities'
import { DomainError } from '@/domain/errors'

export const MAX_KM_PER_LITER = 150
export const MAX_TANK_LITERS = 50
export const MAX_PLATFORM_NAME = 30
export const MIN_PASSWORD_LENGTH = 6

export interface MotorcycleInput {
  brand: string
  model: string
  year: number | null
  fuelSupport: FuelSupport
  kmPerLiterGasoline: number | null
  kmPerLiterEthanol: number | null
  tankLiters: number | null
  useMeasuredConsumption: boolean
}

function assertConsumption(value: number | null): void {
  if (value !== null && !(value >= 1 && value <= MAX_KM_PER_LITER)) throw new DomainError('invalid-consumption')
}

/** Valida e limpa os dados da moto. Moto só a gasolina não guarda consumo de etanol. */
export function normalizeMotorcycleInput(input: MotorcycleInput): MotorcycleInput {
  const brand = input.brand.trim()
  const model = input.model.trim()
  if (!brand || !model) throw new DomainError('invalid-motorcycle')

  if (input.year !== null && !(Number.isInteger(input.year) && input.year >= 1950 && input.year <= 2100)) {
    throw new DomainError('invalid-year')
  }
  if (input.tankLiters !== null && !(input.tankLiters > 0 && input.tankLiters <= MAX_TANK_LITERS)) {
    throw new DomainError('invalid-tank')
  }

  const kmPerLiterEthanol = input.fuelSupport === 'flex' ? input.kmPerLiterEthanol : null
  assertConsumption(input.kmPerLiterGasoline)
  assertConsumption(kmPerLiterEthanol)

  return { ...input, brand, model, kmPerLiterEthanol }
}

export function validateSettings(settings: Settings): Settings {
  if (!(settings.defaultGasolinePriceCents > 0) || !(settings.defaultEthanolPriceCents > 0)) {
    throw new DomainError('invalid-price')
  }
  if (!Number.isInteger(settings.maintenanceReservePer100KmCents) || settings.maintenanceReservePer100KmCents < 0) {
    throw new DomainError('invalid-reserve')
  }
  return settings
}

export function normalizePlatformName(name: string): string {
  const clean = name.trim()
  if (!clean || clean.length > MAX_PLATFORM_NAME) throw new DomainError('invalid-platform-name')
  return clean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** E-mail sem espaços e em minúsculas. */
export function normalizeEmail(email: string): string {
  const clean = email.trim().toLowerCase()
  if (!EMAIL.test(clean)) throw new DomainError('invalid-email')
  return clean
}

export function assertPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) throw new DomainError('invalid-password')
}
