import { beforeEach, describe, expect, it } from 'vitest'

import { addEarning, addExpense, addFueling, listEntries, updateEarning, updateFueling } from '@/actions/entries'
import { getFuelComparison, getMonthlyProfits, getReport, rangeOf, shiftDay } from '@/actions/reports'
import { endShift, startShift } from '@/actions/shifts'
import { setRepos } from '@/data/container'
import { createMemoryRepos } from '@/data/memory/repositories'
import { dayRange } from '@/domain/period'

const at = (iso: string) => new Date(iso)

/** Um dia de trabalho: turno de 120 km, ganhos e um gasto. */
async function workday(day: string, earningCents: number) {
  await startShift(1000, at(`${day}T11:00:00Z`))
  await addEarning({ platformId: 'ifood', amountCents: earningCents, tipCents: 0 }, at(`${day}T15:00:00Z`))
  await addExpense({ category: 'food', amountCents: 2000, description: 'Almoço' }, at(`${day}T15:30:00Z`))
  await endShift(1120, at(`${day}T21:00:00Z`))
}

beforeEach(() => {
  setRepos(createMemoryRepos())
})

describe('períodos', () => {
  it('dia, semana (seg–dom) e mês', () => {
    expect(rangeOf('day', '2026-09-15')).toEqual({ from: '2026-09-15', to: '2026-09-15' })
    expect(rangeOf('week', '2026-09-15')).toEqual({ from: '2026-09-14', to: '2026-09-20' })
    expect(rangeOf('month', '2026-09-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('navegação para trás e para frente', () => {
    expect(shiftDay('day', '2026-09-15', -1)).toBe('2026-09-14')
    expect(shiftDay('week', '2026-09-15', 1)).toBe('2026-09-22')
    expect(shiftDay('month', '2026-09-15', -1)).toBe('2026-08-01')
  })
})

describe('getReport', () => {
  it('semana junta os dias e mantém o combustível estimado', async () => {
    await workday('2026-09-15', 12000)
    await workday('2026-09-16', 8000)

    const report = await getReport('week', '2026-09-16')

    expect(report.range).toEqual({ from: '2026-09-14', to: '2026-09-20' })
    expect(report.summary).toMatchObject({
      km: 240,
      grossCents: 20000,
      fuelCostCents: 0, // nada abastecido nesta semana
      estimatedFuelCostCents: 3720,
      expensesCents: 4000,
      toSaveCents: 2020,
    })
    expect(report.earnings).toEqual([{ key: 'ifood', cents: 20000 }])
    expect(report.costs.map((slice) => slice.key)).toEqual(['food', 'maintenance'])
    expect(report.daily).toHaveLength(7)
    expect(report.daily[1]).toMatchObject({ day: '2026-09-15', grossCents: 12000, km: 120 })
    expect(report.daily[3]).toMatchObject({ day: '2026-09-17', grossCents: 0, km: 0 })
  })

  it('o valor pago no posto vale igual no dia, na semana e no mês (ADR-0018)', async () => {
    await workday('2026-09-15', 12000)
    await addFueling(
      { fuelType: 'ethanol', totalCents: 5000, liters: 12, odometerKm: null, fullTank: true },
      at('2026-09-15T16:00:00Z'),
    )

    const day = await getReport('day', '2026-09-15')
    const week = await getReport('week', '2026-09-15')
    const month = await getReport('month', '2026-09-15')

    for (const report of [day, week, month]) {
      expect(report.summary.fuelCostCents).toBe(5000)
      expect(report.summary.estimatedFuelCostCents).toBe(1860)
      expect(report.summary.toSaveCents).toBe(1010)
    }
    expect(day.summary.netProfitCents).toBe(12000 - 5000 - 2000 - 1010)
  })

  it('abastecer depois de encerrar o turno conta no dia do lançamento', async () => {
    await workday('2026-09-15', 12000)
    await addFueling(
      { fuelType: 'ethanol', totalCents: 5000, liters: 12, odometerKm: null, fullTank: true },
      at('2026-09-16T10:00:00Z'),
    )

    expect((await getReport('day', '2026-09-15')).summary.fuelCostCents).toBe(0)
    expect((await getReport('day', '2026-09-16')).summary.fuelCostCents).toBe(5000)
    expect((await getReport('week', '2026-09-15')).summary.fuelCostCents).toBe(5000)
  })

  it('dia sem movimento vem zerado', async () => {
    const report = await getReport('day', '2026-09-15')
    expect(report.summary).toMatchObject({ km: 0, grossCents: 0, netProfitCents: 0 })
    expect(report.earnings).toEqual([])
    expect(report.daily).toHaveLength(1)
  })
})

describe('getMonthlyProfits', () => {
  it('devolve os últimos meses, do mais antigo para o mais novo', async () => {
    await workday('2026-08-10', 10000)
    await workday('2026-09-15', 20000)

    const months = await getMonthlyProfits('2026-09-15', 3)

    expect(months.map((month) => month.month)).toEqual(['2026-07-01', '2026-08-01', '2026-09-01'])
    expect(months[0]).toMatchObject({ grossCents: 0, km: 0 })
    expect(months[1]).toMatchObject({ grossCents: 10000, km: 120 })
    expect(months[2]).toMatchObject({ grossCents: 20000, km: 120 })
  })
})

describe('getFuelComparison', () => {
  it('compara etanol e gasolina pelo R$/km (exemplo da REGRAS)', async () => {
    const comparison = await getFuelComparison()

    expect(comparison?.options.map((option) => option.fuelType)).toEqual(['gasoline', 'ethanol'])
    expect(comparison?.options[0]?.costPerKmCents).toBeCloseTo(15.5, 2) // 620 ÷ 40
    expect(comparison?.options[1]?.costPerKmCents).toBeCloseTo(14.82, 2) // 415 ÷ 28
    expect(comparison?.cheaper).toBe('ethanol')
  })

  it('moto só a gasolina não compara', async () => {
    setRepos(createMemoryRepos(undefined, { exampleMotorcycle: false }))
    expect(await getFuelComparison()).toBeNull()
  })
})

describe('corrigir lançamentos', () => {
  it('editar o ganho muda o resumo', async () => {
    await workday('2026-09-15', 12000)
    const [earning] = (await listEntries(dayRange('2026-09-15'))).earnings
    expect(earning).toBeDefined()

    await updateEarning({ ...earning!, amountCents: 15000, tipCents: 500 })

    expect((await getReport('day', '2026-09-15')).summary.grossCents).toBe(15500)
  })

  it('editar o abastecimento recalcula o preço por litro', async () => {
    const fueling = await addFueling(
      { fuelType: 'gasoline', totalCents: 3100, liters: 5, odometerKm: null, fullTank: false },
      at('2026-09-15T16:00:00Z'),
    )
    const updated = await updateFueling({ ...fueling, totalCents: 4000, liters: 8 })
    expect(updated.pricePerLiterCents).toBe(500)
  })

  it('valor inválido é recusado', async () => {
    await workday('2026-09-15', 12000)
    const [earning] = (await listEntries(dayRange('2026-09-15'))).earnings
    await expect(updateEarning({ ...earning!, amountCents: 0 })).rejects.toMatchObject({ code: 'invalid-amount' })
  })
})
