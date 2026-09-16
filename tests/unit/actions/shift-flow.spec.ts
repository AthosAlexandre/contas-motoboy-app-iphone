import { beforeEach, describe, expect, it } from 'vitest'

import { addEarning, addExpense, addFueling, listEntries, removeEntry } from '@/actions/entries'
import { getFuelContext } from '@/actions/reference'
import { endShift, getLastKm, getOpenShift, startShift } from '@/actions/shifts'
import { getPeriodSummary } from '@/actions/summary'
import { setRepos } from '@/data/container'
import { createMemoryRepos } from '@/data/memory/repositories'
import { dayRange } from '@/domain/period'

// 15/09/2026 em São Paulo (UTC−3)
const morning = new Date('2026-09-15T11:00:00Z') // 08:00
const lunch = new Date('2026-09-15T15:00:00Z') // 12:00
const evening = new Date('2026-09-15T21:00:00Z') // 18:00
const today = dayRange('2026-09-15')

beforeEach(() => {
  setRepos(createMemoryRepos())
})

describe('turno', () => {
  it('não abre dois turnos ao mesmo tempo', async () => {
    await startShift(1000, morning)
    await expect(startShift(1000, lunch)).rejects.toMatchObject({ code: 'shift-already-open' })
  })

  it('km final menor que o inicial é recusado e o turno continua aberto', async () => {
    await startShift(1000, morning)
    await expect(endShift(900, evening)).rejects.toMatchObject({ code: 'km-end-before-start' })
    expect(await getOpenShift()).not.toBeNull()
  })

  it('encerrar sem turno aberto', async () => {
    await expect(endShift(1000, evening)).rejects.toMatchObject({ code: 'no-open-shift' })
  })

  it('dia completo: ganhos + abastecimento + encerramento → resumo e quanto guardar', async () => {
    const shift = await startShift(1000, morning)
    expect(shift.day).toBe('2026-09-15')

    const ifood = await addEarning({ platformId: 'ifood', amountCents: 12000, tipCents: 0 }, lunch)
    await addEarning({ platformId: '99food', amountCents: 5000, tipCents: 1000 }, lunch)
    await addExpense({ category: 'food', amountCents: 2000, description: '  Almoço ' }, lunch)
    const fuel = await addFueling({ fuelType: 'gasoline', totalCents: 3100, liters: 5, odometerKm: null, fullTank: false }, lunch)

    expect(ifood.shiftId).toBe(shift.id)
    expect(fuel.pricePerLiterCents).toBe(620)

    const closed = await endShift(1120, evening)
    expect(closed.snapshot).toEqual({
      fuelTypeUsed: 'gasoline',
      kmPerLiterUsed: 40,
      fuelPriceCentsUsed: 620,
      fuelCostCents: 1860,
      maintenanceReserveCents: 1010,
    })

    const summary = await getPeriodSummary(today)
    expect(summary).toMatchObject({
      km: 120,
      grossCents: 18000,
      expensesCents: 2000,
      fuelCostCents: 3100, // valor pago no abastecimento de hoje (ADR-0018)
      estimatedFuelCostCents: 1860, // indicador por km
      maintenanceReserveCents: 1010,
      netProfitCents: 11890,
      toSaveCents: 1010,
    })

    expect(await getOpenShift()).toBeNull()
    expect(await getLastKm()).toBe(1120)

    const entries = await listEntries(today)
    expect(entries.expenses[0]?.description).toBe('Almoço')
    expect(entries.earnings).toHaveLength(2)
  })

  it('snapshot não muda quando o preço muda depois (ADR-0009)', async () => {
    await startShift(1000, morning)
    await endShift(1120, evening)
    await addFueling(
      { fuelType: 'gasoline', totalCents: 4000, liters: 5, odometerKm: null, fullTank: false },
      new Date('2026-09-16T12:00:00Z'),
    )

    const summary = await getPeriodSummary(today)
    // O abastecimento foi lançado no dia seguinte: não entra neste dia, e o snapshot não muda.
    expect(summary.fuelCostCents).toBe(0)
    expect(summary.estimatedFuelCostCents).toBe(1860)
    expect((await getFuelContext())?.pricePerLiterCents).toBe(800)
  })
})

describe('lançamentos', () => {
  it('valida valor, gorjeta e litros', async () => {
    await expect(addEarning({ platformId: 'ifood', amountCents: 0, tipCents: 0 })).rejects.toMatchObject({ code: 'invalid-amount' })
    await expect(addEarning({ platformId: 'ifood', amountCents: 100, tipCents: -1 })).rejects.toMatchObject({ code: 'invalid-tip' })
    await expect(
      addFueling({ fuelType: 'gasoline', totalCents: 3000, liters: 0, odometerKm: null, fullTank: false }),
    ).rejects.toMatchObject({ code: 'invalid-liters' })
  })

  it('ganho sem turno aberto fica sem turno', async () => {
    const earning = await addEarning({ platformId: 'ifood', amountCents: 1000, tipCents: 0 }, lunch)
    expect(earning.shiftId).toBeNull()
  })

  it('excluir lançamento', async () => {
    const expense = await addExpense({ category: 'other', amountCents: 500, description: '' }, lunch)
    await removeEntry('expense', expense.id)
    expect((await listEntries(today)).expenses).toHaveLength(0)
  })
})

describe('contexto de combustível', () => {
  it('sem abastecimentos: gasolina, ficha e preço padrão', async () => {
    expect(await getFuelContext()).toEqual({ fuelType: 'gasoline', kmPerLiter: 40, measured: false, pricePerLiterCents: 620 })
  })

  it('depois de abastecer etanol: etanol, ficha do etanol e preço pago', async () => {
    await addFueling({ fuelType: 'ethanol', totalCents: 4150, liters: 10, odometerKm: null, fullTank: false }, lunch)
    expect(await getFuelContext()).toEqual({ fuelType: 'ethanol', kmPerLiter: 28, measured: false, pricePerLiterCents: 415 })
  })
})
