import { describe, expect, it } from 'vitest'

import { maintenanceReserveCents, maintenanceStatus, reservePerKmCents } from '@/domain/calculators/maintenance'
import type { MaintenanceItem } from '@/domain/entities'

// Exemplo de docs/REGRAS-DE-NEGOCIO.md: óleo R$ 45/1.000 km, relação R$ 250/20.000 km, pneus R$ 400/15.000 km.
const items = [
  { estimatedCostCents: 4500, intervalKm: 1000 },
  { estimatedCostCents: 25000, intervalKm: 20000 },
  { estimatedCostCents: 40000, intervalKm: 15000 },
]

const item = (overrides: Partial<MaintenanceItem> = {}): MaintenanceItem => ({
  id: 'oleo',
  motorcycleId: 'm1',
  name: 'Troca de óleo',
  intervalKm: 1000,
  intervalDays: null,
  estimatedCostCents: 4500,
  lastKm: 10000,
  lastDate: '2026-09-01',
  ...overrides,
})

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

describe('maintenanceStatus (por km)', () => {
  it('recém trocado: em dia e faltando o intervalo inteiro', () => {
    const status = maintenanceStatus(item(), 10000, '2026-09-01')
    expect(status).toMatchObject({ kmSince: 0, kmLeft: 1000, ratio: 0, state: 'ok' })
  })

  it('700 km rodados: ainda em dia', () => {
    expect(maintenanceStatus(item(), 10700, '2026-09-16')).toMatchObject({ kmSince: 700, kmLeft: 300, state: 'ok' })
  })

  it('a partir de 90% do intervalo entra em atenção', () => {
    expect(maintenanceStatus(item(), 10900, '2026-09-16').state).toBe('warning')
  })

  it('passou do intervalo: vencido, com km negativo', () => {
    const status = maintenanceStatus(item(), 11200, '2026-09-16')
    expect(status).toMatchObject({ kmSince: 1200, kmLeft: -200, state: 'overdue' })
    expect(status.ratio).toBeCloseTo(1.2, 5)
  })

  it('odômetro menor que a última troca não conta km negativo', () => {
    expect(maintenanceStatus(item({ lastKm: 12000 }), 11000, '2026-09-16')).toMatchObject({ kmSince: 0, state: 'ok' })
  })
})

describe('maintenanceStatus (por tempo)', () => {
  const oleo = item({ intervalDays: 180 })

  it('conta os dias desde a última troca', () => {
    expect(maintenanceStatus(oleo, 10000, '2026-09-16')).toMatchObject({ daysSince: 15, daysLeft: 165, state: 'ok' })
  })

  it('vence pelo que chegar primeiro: tempo estourado com km em dia', () => {
    const status = maintenanceStatus(oleo, 10100, '2027-04-01')
    expect(status).toMatchObject({ kmLeft: 900, state: 'overdue' })
    expect(status.daysLeft).toBeLessThan(0)
  })

  it('sem prazo em dias, só o km manda', () => {
    expect(maintenanceStatus(item(), 10000, '2030-01-01')).toMatchObject({ daysLeft: null, state: 'ok' })
  })
})
