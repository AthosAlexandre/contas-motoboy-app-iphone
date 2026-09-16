/**
 * Valores iniciais de uma conta nova (Firestore) e do modo local.
 */
import type { Platform, Settings } from '@/domain/entities'

export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'ifood', name: 'iFood', isActive: true, order: 1 },
  { id: '99food', name: '99Food', isActive: true, order: 2 },
]

export interface MaintenancePreset {
  name: string
  intervalKm: number
  intervalDays: number | null
  estimatedCostCents: number
}

/**
 * Itens sugeridos ao montar a manutenção (o usuário ajusta intervalo e preço aos dele).
 * Valores de referência para moto de entrega; servem só como ponto de partida.
 */
export const MAINTENANCE_PRESETS: MaintenancePreset[] = [
  { name: 'Troca de óleo', intervalKm: 1000, intervalDays: 180, estimatedCostCents: 4500 },
  { name: 'Filtro de óleo', intervalKm: 3000, intervalDays: null, estimatedCostCents: 2500 },
  { name: 'Relação (kit)', intervalKm: 20000, intervalDays: null, estimatedCostCents: 25000 },
  { name: 'Pneus', intervalKm: 15000, intervalDays: null, estimatedCostCents: 40000 },
  { name: 'Pastilhas de freio', intervalKm: 10000, intervalDays: null, estimatedCostCents: 12000 },
  { name: 'Revisão', intervalKm: 6000, intervalDays: 365, estimatedCostCents: 20000 },
]

/** Exemplos da REGRAS-DE-NEGOCIO: gasolina R$ 6,20/l, etanol R$ 4,15/l, reserva R$ 8,42 a cada 100 km. */
export const DEFAULT_SETTINGS: Settings = {
  defaultGasolinePriceCents: 620,
  defaultEthanolPriceCents: 415,
  maintenanceReservePer100KmCents: 842,
}
