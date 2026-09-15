/**
 * Dados iniciais do modo local (sem Firebase). Plataformas e Ajustes vêm de domain/defaults.
 */
import type { Motorcycle } from '@/domain/entities'

/** Moto de exemplo (flex) — o usuário pode editar ou trocar em "Minha moto". */
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
  activeFrom: '2026-01-01T00:00:00.000Z',
  activeUntil: null,
}
