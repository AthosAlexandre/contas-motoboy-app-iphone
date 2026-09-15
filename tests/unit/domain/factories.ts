import type { Fueling, Motorcycle, Settings } from '@/domain/entities'

let counter = 0

export function fueling(overrides: Partial<Fueling> = {}): Fueling {
  counter += 1
  return {
    id: `f${counter}`,
    motorcycleId: 'm1',
    fuelType: 'gasoline',
    totalCents: 3100,
    liters: 5,
    pricePerLiterCents: 620,
    odometerKm: null,
    fullTank: false,
    day: '2026-09-15',
    createdAt: `2026-09-15T10:${String(counter % 60).padStart(2, '0')}:00.000Z`,
    source: 'manual',
    ...overrides,
  }
}

export function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 'm1',
    brand: 'Honda',
    model: 'CG 160',
    year: 2024,
    fuelSupport: 'flex',
    kmPerLiterGasoline: 40,
    kmPerLiterEthanol: 28,
    tankLiters: 14,
    useMeasuredConsumption: true,
    specsSource: 'manual',
    activeFrom: '2026-01-01T00:00:00.000Z',
    activeUntil: null,
    ...overrides,
  }
}

export const settings: Settings = {
  defaultGasolinePriceCents: 620,
  defaultEthanolPriceCents: 415,
  maintenanceReservePer100KmCents: 842,
}
