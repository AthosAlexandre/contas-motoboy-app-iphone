/**
 * Valores iniciais de uma conta nova (Firestore) e do modo local.
 */
import type { Platform, Settings } from '@/domain/entities'

export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'ifood', name: 'iFood', isActive: true, order: 1 },
  { id: '99food', name: '99Food', isActive: true, order: 2 },
]

/** Exemplos da REGRAS-DE-NEGOCIO: gasolina R$ 6,20/l, etanol R$ 4,15/l, reserva R$ 8,42 a cada 100 km. */
export const DEFAULT_SETTINGS: Settings = {
  defaultGasolinePriceCents: 620,
  defaultEthanolPriceCents: 415,
  maintenanceReservePer100KmCents: 842,
}
