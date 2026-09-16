import { describe, expect, it } from 'vitest'

import { costBreakdown, dailySeries, earningsByPlatform, expensesByCategory } from '@/domain/calculators/breakdown'
import { summarizePeriod } from '@/domain/calculators/profit'
import type { Earning, Expense, Fueling, Shift } from '@/domain/entities'

const fueling = (totalCents: number, day = '2026-09-15'): Fueling => ({
  id: `f-${totalCents}-${day}`,
  motorcycleId: 'm1',
  fuelType: 'ethanol',
  totalCents,
  liters: 10,
  pricePerLiterCents: totalCents / 10,
  odometerKm: null,
  fullTank: true,
  day,
  createdAt: `${day}T14:00:00.000Z`,
  source: 'manual',
})

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
  it('usa o combustível pago, a reserva e os gastos, sem fatias zeradas', () => {
    const expenses = [expense('food', 2000)]
    const summary = summarizePeriod({
      shifts: [shift('2026-09-15', 1000, 1120, 1860, 1010)],
      earnings: [],
      expenses,
      fuelings: [fueling(5000)],
    })

    expect(costBreakdown(summary, expenses)).toEqual([
      { key: 'fuel', cents: 5000 },
      { key: 'food', cents: 2000 },
      { key: 'maintenance', cents: 1010 },
    ])
  })

  it('sem abastecimento no período, não há fatia de combustível', () => {
    const expenses = [expense('food', 2000)]
    const summary = summarizePeriod({ shifts: [shift('2026-09-15', 1000, 1120, 1860, 1010)], earnings: [], expenses })

    expect(costBreakdown(summary, expenses).map((slice) => slice.key)).toEqual(['food', 'maintenance'])
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
    expect(series[1]).toEqual({ day: '2026-09-15', grossCents: 18000, netCents: 14990, km: 120 })
  })

  it('o abastecimento pesa no dia em que foi lançado', () => {
    const range = { from: '2026-09-15', to: '2026-09-16' }
    const series = dailySeries(range, {
      shifts: [shift('2026-09-15', 1000, 1120, 1860, 1010)],
      earnings: [earning('ifood', 18000)],
      expenses: [],
      fuelings: [fueling(5000, '2026-09-16')],
    })

    expect(series[0]?.netCents).toBe(16990) // 18000 − 1010 de reserva
    expect(series[1]?.netCents).toBe(-5000) // dia sem ganho, só o tanque
  })
})
