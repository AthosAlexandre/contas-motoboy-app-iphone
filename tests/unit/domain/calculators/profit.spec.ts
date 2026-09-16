import { describe, expect, it } from 'vitest'

import { summarizePeriod } from '@/domain/calculators/profit'
import type { Earning, Expense, Shift } from '@/domain/entities'
import { fueling } from '../factories'

const closedShift: Shift = {
  id: 's1',
  motorcycleId: 'm1',
  day: '2026-09-15',
  startedAt: '2026-09-15T11:00:00.000Z',
  endedAt: '2026-09-15T21:00:00.000Z',
  kmStart: 1000,
  kmEnd: 1120,
  snapshot: {
    fuelTypeUsed: 'gasoline',
    kmPerLiterUsed: 40,
    fuelPriceCentsUsed: 620,
    fuelCostCents: 1860,
    maintenanceReserveCents: 1010,
  },
}

const openShift: Shift = { ...closedShift, id: 's2', endedAt: null, kmEnd: null, snapshot: null }

const earning = (amountCents: number, tipCents = 0): Earning => ({
  id: `e${amountCents}`,
  platformId: 'ifood',
  amountCents,
  tipCents,
  day: '2026-09-15',
  createdAt: '2026-09-15T12:00:00.000Z',
  shiftId: 's1',
  source: 'manual',
})

const expense: Expense = {
  id: 'x1',
  category: 'food',
  amountCents: 2000,
  description: 'Almoço',
  day: '2026-09-15',
  createdAt: '2026-09-15T15:00:00.000Z',
  source: 'manual',
}

describe('summarizePeriod', () => {
  it('sem abastecer no dia: só a reserva de manutenção entra como custo de moto (ADR-0018)', () => {
    const summary = summarizePeriod({
      shifts: [closedShift],
      earnings: [earning(12000), earning(5000, 1000)],
      expenses: [expense],
    })

    expect(summary).toMatchObject({
      km: 120,
      grossCents: 18000,
      expensesCents: 2000,
      fuelCostCents: 0,
      estimatedFuelCostCents: 1860, // indicador: quanto o combustível teria custado por km
      maintenanceReserveCents: 1010,
      operatingProfitCents: 16000,
      netProfitCents: 14990,
      toSaveCents: 1010, // guardar = manutenção (o combustível se paga no posto)
      closedShifts: 1,
      openShifts: 0,
      missingConsumption: false,
    })
    expect(summary.grossPerKmCents).toBe(150)
    expect(summary.netPerKmCents).toBeCloseTo(124.92, 2)
  })

  it('turno aberto não entra no km nem nos custos', () => {
    const summary = summarizePeriod({ shifts: [openShift], earnings: [earning(5000)], expenses: [] })
    expect(summary).toMatchObject({ km: 0, openShifts: 1, closedShifts: 0, fuelCostCents: 0, netProfitCents: 5000 })
    expect(summary.grossPerKmCents).toBeNull()
  })

  it('abastecimento entra pelo valor pago, no dia do lançamento', () => {
    const summary = summarizePeriod({
      shifts: [closedShift],
      earnings: [earning(18000)],
      expenses: [],
      fuelings: [fueling({ totalCents: 3100 }), fueling({ totalCents: 2000 })],
    })
    expect(summary.fuelCostCents).toBe(5100)
    expect(summary.estimatedFuelCostCents).toBe(1860)
    expect(summary.netProfitCents).toBe(18000 - 5100 - 1010)
    expect(summary.toSaveCents).toBe(1010)
  })

  it('avisa quando um turno ficou sem consumo', () => {
    const withoutConsumption: Shift = {
      ...closedShift,
      snapshot: { ...closedShift.snapshot!, kmPerLiterUsed: null, fuelCostCents: null },
    }
    const summary = summarizePeriod({ shifts: [withoutConsumption], earnings: [], expenses: [] })
    expect(summary.missingConsumption).toBe(true)
    expect(summary.estimatedFuelCostCents).toBe(0)
    // O valor pago no posto não depende do consumo: continua vindo dos abastecimentos.
    expect(summary.fuelCostCents).toBe(0)
  })
})
