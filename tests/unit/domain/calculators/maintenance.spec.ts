import { describe, expect, it } from 'vitest'

import { maintenanceReserveCents, reservePerKmCents } from '@/domain/calculators/maintenance'

// Exemplo de docs/REGRAS-DE-NEGOCIO.md: óleo R$ 45/1.000 km, relação R$ 250/20.000 km, pneus R$ 400/15.000 km.
const items = [
  { estimatedCostCents: 4500, intervalKm: 1000 },
  { estimatedCostCents: 25000, intervalKm: 20000 },
  { estimatedCostCents: 40000, intervalKm: 15000 },
]

describe('reservePerKmCents', () => {
  it('soma o custo por km dos itens (≈ R$ 0,084/km)', () => {
    expect(reservePerKmCents(items)).toBeCloseTo(8.4167, 4)
  })

  it('ignora itens sem intervalo ou sem custo', () => {
    expect(reservePerKmCents([{ estimatedCostCents: 4500, intervalKm: 0 }, { estimatedCostCents: 0, intervalKm: 1000 }])).toBe(0)
  })
})

describe('maintenanceReserveCents', () => {
  it('120 km → ≈ R$ 10,10', () => {
    expect(maintenanceReserveCents(120, reservePerKmCents(items))).toBe(1010)
  })

  it('sem km não reserva', () => {
    expect(maintenanceReserveCents(0, 8.42)).toBe(0)
  })
})
