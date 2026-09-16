/**
 * Casos de uso da manutenção: itens que se desgastam, quanto falta para a próxima troca,
 * registrar a troca feita e a reserva por km que sai daí.
 */
import { repos } from '@/data/container'
import { byUrgency, maintenanceStatus, reservePerKmCents, type MaintenanceStatus } from '@/domain/calculators/maintenance'
import { MAINTENANCE_PRESETS } from '@/domain/defaults'
import type { MaintenanceItem, MaintenanceRecord } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { toDayKey } from '@/domain/period'

export interface MaintenanceItemInput {
  name: string
  intervalKm: number
  intervalDays: number | null
  estimatedCostCents: number
  lastKm: number
  lastDate: string
}

export interface MaintenanceView {
  item: MaintenanceItem
  status: MaintenanceStatus
}

export interface MaintenanceOverview {
  odometerKm: number
  items: MaintenanceView[]
  /** Reserva por km dos itens (0 quando não há itens). */
  reservePerKmCents: number
  /** Quantos itens vencidos e quantos perto de vencer. */
  overdue: number
  warning: number
  /** `false` = ainda usando o valor por 100 km dos Ajustes. */
  usesItems: boolean
}

function normalize(input: MaintenanceItemInput): MaintenanceItemInput {
  const name = input.name.trim()
  if (!name) throw new DomainError('invalid-maintenance-name')
  if (!Number.isFinite(input.intervalKm) || input.intervalKm <= 0) throw new DomainError('invalid-interval')
  if (input.intervalDays !== null && !(input.intervalDays > 0)) throw new DomainError('invalid-interval')
  if (!Number.isInteger(input.estimatedCostCents) || input.estimatedCostCents <= 0) throw new DomainError('invalid-amount')
  if (!Number.isFinite(input.lastKm) || input.lastKm < 0) throw new DomainError('invalid-km')
  return { ...input, name }
}

async function activeMotorcycleId(): Promise<string> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) throw new DomainError('no-motorcycle')
  return motorcycle.id
}

/**
 * Km atual da moto: o maior número já registrado (fim de turno, turno aberto, abastecimento ou a
 * última troca informada).
 */
export async function getOdometer(): Promise<number> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) return 0

  const [lastClosed, open, fuelings, items] = await Promise.all([
    repos.shifts.findLastClosed(),
    repos.shifts.findOpen(),
    repos.fuelings.listByMotorcycle(motorcycle.id),
    repos.maintenanceItems.listByMotorcycle(motorcycle.id),
  ])

  return Math.max(
    0,
    lastClosed?.kmEnd ?? 0,
    open?.kmStart ?? 0,
    ...fuelings.map((fueling) => fueling.odometerKm ?? 0),
    ...items.map((item) => item.lastKm),
  )
}

export async function getMaintenanceOverview(now = new Date()): Promise<MaintenanceOverview | null> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) return null

  const [items, odometerKm] = await Promise.all([
    repos.maintenanceItems.listByMotorcycle(motorcycle.id),
    getOdometer(),
  ])

  const today = toDayKey(now)
  const views = items
    .map((item) => ({ item, status: maintenanceStatus(item, odometerKm, today) }))
    .sort(byUrgency)

  return {
    odometerKm,
    items: views,
    reservePerKmCents: reservePerKmCents(items),
    overdue: views.filter((view) => view.status.state === 'overdue').length,
    warning: views.filter((view) => view.status.state === 'warning').length,
    usesItems: items.length > 0,
  }
}

export async function addMaintenanceItem(input: MaintenanceItemInput): Promise<MaintenanceItem> {
  const data = normalize(input)
  return repos.maintenanceItems.add({ ...data, motorcycleId: await activeMotorcycleId() })
}

export async function updateMaintenanceItem(item: MaintenanceItem): Promise<MaintenanceItem> {
  const data = normalize(item)
  const updated = { ...item, ...data }
  await repos.maintenanceItems.update(updated)
  return updated
}

export async function removeMaintenanceItem(id: string): Promise<void> {
  await repos.maintenanceItems.remove(id)
}

/** Cria os itens sugeridos que ainda não existem. Retorna quantos foram criados. */
export async function addSuggestedItems(now = new Date()): Promise<number> {
  const motorcycleId = await activeMotorcycleId()
  const [existing, odometerKm] = await Promise.all([
    repos.maintenanceItems.listByMotorcycle(motorcycleId),
    getOdometer(),
  ])

  const names = new Set(existing.map((item) => item.name.toLocaleLowerCase('pt-BR')))
  const missing = MAINTENANCE_PRESETS.filter((preset) => !names.has(preset.name.toLocaleLowerCase('pt-BR')))

  for (const preset of missing) {
    await repos.maintenanceItems.add({
      motorcycleId,
      name: preset.name,
      intervalKm: preset.intervalKm,
      intervalDays: preset.intervalDays,
      estimatedCostCents: preset.estimatedCostCents,
      lastKm: odometerKm,
      lastDate: toDayKey(now),
    })
  }

  return missing.length
}

export interface MaintenanceDoneInput {
  odometerKm: number
  costCents: number
  day?: string
}

/** Registra a troca: guarda no histórico e zera a contagem do item. */
export async function registerMaintenance(
  itemId: string,
  input: MaintenanceDoneInput,
  now = new Date(),
): Promise<MaintenanceItem> {
  const motorcycleId = await activeMotorcycleId()
  const items = await repos.maintenanceItems.listByMotorcycle(motorcycleId)
  const item = items.find((current) => current.id === itemId)
  if (!item) throw new DomainError('not-found')

  if (!Number.isFinite(input.odometerKm) || input.odometerKm < 0) throw new DomainError('invalid-km')
  if (!Number.isInteger(input.costCents) || input.costCents < 0) throw new DomainError('invalid-amount')

  const day = input.day ?? toDayKey(now)

  await repos.maintenanceRecords.add({
    motorcycleId,
    itemId: item.id,
    itemName: item.name,
    odometerKm: input.odometerKm,
    costCents: input.costCents,
    day,
    createdAt: now.toISOString(),
  })

  // O custo real vira a nova estimativa: da próxima vez a reserva já usa o preço de verdade.
  const updated: MaintenanceItem = {
    ...item,
    lastKm: input.odometerKm,
    lastDate: day,
    estimatedCostCents: input.costCents > 0 ? input.costCents : item.estimatedCostCents,
  }
  await repos.maintenanceItems.update(updated)
  return updated
}

export async function listMaintenanceHistory(): Promise<MaintenanceRecord[]> {
  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) return []
  const records = await repos.maintenanceRecords.listByMotorcycle(motorcycle.id)
  return records.reverse()
}
