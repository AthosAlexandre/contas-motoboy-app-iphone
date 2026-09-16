import { beforeEach, describe, expect, it } from 'vitest'

import { addFueling } from '@/actions/entries'
import {
  addMaintenanceItem,
  addSuggestedItems,
  getMaintenanceOverview,
  getOdometer,
  listMaintenanceHistory,
  registerMaintenance,
  removeMaintenanceItem,
  updateMaintenanceItem,
  type MaintenanceItemInput,
} from '@/actions/maintenance'
import { getPeriodSummary } from '@/actions/summary'
import { endShift, startShift } from '@/actions/shifts'
import { setRepos } from '@/data/container'
import { createMemoryRepos } from '@/data/memory/repositories'
import { MAINTENANCE_PRESETS } from '@/domain/defaults'
import { dayRange } from '@/domain/period'

const at = (iso: string) => new Date(iso)
const morning = at('2026-09-15T11:00:00Z')
const evening = at('2026-09-15T21:00:00Z')

const oleo: MaintenanceItemInput = {
  name: ' Troca de óleo ',
  intervalKm: 1000,
  intervalDays: 180,
  estimatedCostCents: 4500,
  lastKm: 10000,
  lastDate: '2026-09-01',
}

beforeEach(() => {
  setRepos(createMemoryRepos())
})

describe('itens de manutenção', () => {
  it('cadastrar limpa o nome e valida', async () => {
    const item = await addMaintenanceItem(oleo)
    expect(item.name).toBe('Troca de óleo')

    await expect(addMaintenanceItem({ ...oleo, name: '  ' })).rejects.toMatchObject({ code: 'invalid-maintenance-name' })
    await expect(addMaintenanceItem({ ...oleo, intervalKm: 0 })).rejects.toMatchObject({ code: 'invalid-interval' })
    await expect(addMaintenanceItem({ ...oleo, estimatedCostCents: 0 })).rejects.toMatchObject({ code: 'invalid-amount' })
  })

  it('itens sugeridos entram uma vez só', async () => {
    expect(await addSuggestedItems(evening)).toBe(MAINTENANCE_PRESETS.length)
    expect(await addSuggestedItems(evening)).toBe(0)

    const overview = await getMaintenanceOverview(evening)
    expect(overview?.items).toHaveLength(MAINTENANCE_PRESETS.length)
    // Começam do km atual, então nascem em dia.
    expect(overview?.items.every((view) => view.status.state === 'ok')).toBe(true)
  })

  it('editar e excluir', async () => {
    const item = await addMaintenanceItem(oleo)
    const updated = await updateMaintenanceItem({ ...item, intervalKm: 1500, estimatedCostCents: 5000 })
    expect(updated).toMatchObject({ intervalKm: 1500, estimatedCostCents: 5000 })

    await removeMaintenanceItem(item.id)
    expect((await getMaintenanceOverview(evening))?.items).toHaveLength(0)
  })
})

describe('odômetro e situação', () => {
  it('usa o maior km conhecido (turno, abastecimento ou última troca)', async () => {
    await addMaintenanceItem(oleo)
    expect(await getOdometer()).toBe(10000)

    await addFueling({ fuelType: 'gasoline', totalCents: 3100, liters: 5, odometerKm: 10400, fullTank: true }, morning)
    expect(await getOdometer()).toBe(10400)

    await startShift(10500, morning)
    await endShift(10900, evening)
    expect(await getOdometer()).toBe(10900)
  })

  it('conta quantos itens estão vencidos e quantos estão perto', async () => {
    await addMaintenanceItem(oleo) // 1.000 km desde 10.000
    await addMaintenanceItem({ ...oleo, name: 'Relação', intervalKm: 20000, intervalDays: null, estimatedCostCents: 25000 })

    await startShift(10000, morning)
    await endShift(11100, evening) // 1.100 km rodados → óleo vencido

    const overview = await getMaintenanceOverview(evening)
    expect(overview).toMatchObject({ odometerKm: 11100, overdue: 1, warning: 0, usesItems: true })
    // Mais urgente primeiro.
    expect(overview?.items[0]?.item.name).toBe('Troca de óleo')
    expect(overview?.items[0]?.status.kmLeft).toBe(-100)
  })
})

describe('reserva vinda dos itens', () => {
  it('sem itens, usa o valor por 100 km dos Ajustes', async () => {
    await startShift(10000, morning)
    const closed = await endShift(10120, evening)
    expect(closed.snapshot?.maintenanceReserveCents).toBe(1010) // 120 km × R$ 8,42/100 km
  })

  it('com itens, a reserva sai do custo por km deles', async () => {
    await addMaintenanceItem(oleo) // R$ 45 a cada 1.000 km = R$ 0,045/km
    await startShift(10000, morning)
    const closed = await endShift(10120, evening)

    expect(closed.snapshot?.maintenanceReserveCents).toBe(540) // 120 km × 4,5 centavos
    expect((await getPeriodSummary(dayRange('2026-09-15'))).toSaveCents).toBe(540)
  })
})

describe('registrar a troca', () => {
  it('zera a contagem, guarda no histórico e passa a usar o preço pago', async () => {
    const item = await addMaintenanceItem(oleo)
    await startShift(10000, morning)
    await endShift(11100, evening) // óleo vencido

    const updated = await registerMaintenance(item.id, { odometerKm: 11100, costCents: 6000 }, evening)
    expect(updated).toMatchObject({ lastKm: 11100, lastDate: '2026-09-15', estimatedCostCents: 6000 })

    const overview = await getMaintenanceOverview(evening)
    expect(overview).toMatchObject({ overdue: 0, warning: 0 })
    expect(overview?.items[0]?.status.kmSince).toBe(0)
    // Preço novo entra na reserva: R$ 60 a cada 1.000 km = 6 centavos/km.
    expect(overview?.reservePerKmCents).toBeCloseTo(6, 5)

    const history = await listMaintenanceHistory()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ itemName: 'Troca de óleo', odometerKm: 11100, costCents: 6000 })
  })

  it('item inexistente e valores inválidos são recusados', async () => {
    const item = await addMaintenanceItem(oleo)
    await expect(registerMaintenance('nao-existe', { odometerKm: 11000, costCents: 5000 })).rejects.toMatchObject({
      code: 'not-found',
    })
    await expect(registerMaintenance(item.id, { odometerKm: -1, costCents: 5000 })).rejects.toMatchObject({
      code: 'invalid-km',
    })
  })
})
