/**
 * Dados iniciais do modo local (até a Sprint 2, quando moto, plataformas e Ajustes vêm do Firestore).
 */
import type { Motorcycle, Platform, Settings } from '@/domain/entities'

export const SEED_PLATFORMS: Platform[] = [
  { id: 'ifood', name: 'iFood', isActive: true, order: 1 },
  { id: '99food', name: '99Food', isActive: true, order: 2 },
]

/** Moto de exemplo (flex) — substituída pelo cadastro "Minha moto" na Sprint 2. */
export const SEED_MOTORCYCLE: Motorcycle = {
  id: 'example-motorcycle',
  brand: 'Moto',
  model: 'de exemplo',
  year: null,
  fuelSupport: 'flex',
  kmPerLiterGasoline: 40,
  kmPerLiterEthanol: 28,
  tankLiters: null,
  useMeasuredConsumption: true,
  specsSource: 'manual',
}

/** Exemplos da REGRAS-DE-NEGOCIO: gasolina R$ 6,20/l, etanol R$ 4,15/l, reserva R$ 8,42 a cada 100 km. */
export const DEFAULT_SETTINGS: Settings = {
  defaultGasolinePriceCents: 620,
  defaultEthanolPriceCents: 415,
  maintenanceReservePer100KmCents: 842,
}
