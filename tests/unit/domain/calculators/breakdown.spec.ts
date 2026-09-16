import { describe, expect, it } from 'vitest'

import { costBreakdown, dailySeries, earningsByPlatform, expensesByCategory } from '@/domain/calculators/breakdown'
import { summarizePeriod } from '@/domain/calculators/profit'
import type { Earning, Expense, Shift } from '@/domain/entities'

const earning = (platformId: string, amountCents: number, tipCents = 0, day = '2026-09-15'): Earning => ({
  id: `${platformId}-${amountCents}-${day}`,
  platformId,
  amountCents,
  tipCents,
  day,
  createdAt: `${day}T12:00:00.000Z`,
  shiftId: null,
  source: 'manual',
})

const expense = (category: Expense['category'], amountCents: number, day = '2026-09-15'): Expense => ({
  id: `${category}-${amountCents}-${day}`,
  category,
  amountCents,
  description: '',
  day,
  createdAt: `${day}T13:00:00.000Z`,
  source: 'manual',
})

const shift = (day: string, kmStart: number, kmEnd: number, fuelCostCents: number, reserveCents: number): Shift => ({
  id: `s-${day}`,
  motorcycleId: 'm1',
  day,
  startedAt: `${day}T11:00:00.000Z`,
  endedAt: `${day}T21:00:00.000Z`,
  kmStart,
  kmEnd,
  snapshot: {
    fuelTypeUsed: 'gasoline',
    kmPerLiterUsed: 40,
    fuelPriceCentsUsed: 620,
    fuelCostCents,
    maintenanceReserveCents: reserveCents,
  },
})

describe('earningsByPlatform', () => {
  it('soma com gorjeta e ordena do maior para o menor', () => {
    const slices = earningsByPlatform([earning('ifood', 12000), earning('99food', 5000, 1000), earning('ifood', 3000)])
    expect(slices).toEqual([
      { key: 'ifood', cents: 15000 },
      { key: '99food', cents: 6000 },
    ])
  })

  it('sem ganhos, sem fatias', () => {
    expect(earningsByPlatform([])).toEqual([])
  })
})

describe('expensesByCategory', () => {
  it('agrupa por categoria', () => {
    expect(expensesByCategory([expense('food', 2000), expense('food', 1500), expense('fine', 12000)])).toEqual([
      { key: 'fine', cents: 12000 },
      { key: 'food', cents: 3500 },
    ])
  })
})

describe('costBreakdown', () => {
  it('junta combustível, reserva e os gastos, sem fatias zeradas', () => {
    const expenses = [expense('food', 2000)]
    const summary = summarizePeriod({ shifts: [shift('2026-09-15', 1000, 1120, 1860, 1010)], earnings: [], expenses })

    expect(costBreakdown(summary, expenses)).toEqual([
      { key: 'food', cents: 2000 },
      { key: 'fuel', cents: 1860 },
      { key: 'maintenance', cents: 1010 },
    ])
  })
})

describe('dailySeries', () => {
  it('um ponto por dia, com os dias parados zerados', () => {
    const range = { from: '2026-09-14', to: '2026-09-16' }
    const series = dailySeries(range, {
      shifts: [shift('2026-09-15', 1000, 1120, 1860, 1010)],
      earnings: [earning('ifood', 18000)],
      expenses: [expense('food', 2000)],
    })

    expect(series.map((point) => point.day)).toEqual(['2026-09-14', '2026-09-15', '2026-09-16'])
    expect(series[0]).toEqual({ day: '2026-09-14', grossCents: 0, netCents: 0, km: 0 })
    expect(series[1]).toEqual({ day: '2026-09-15', grossCents: 18000, netCents: 13130, km: 120 })
  })
})
