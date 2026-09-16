/**
 * Casos de uso do turno.
 */
import { repos } from '@/data/container'
import { reservePerKmCents } from '@/domain/calculators/maintenance'
import { buildShiftSnapshot, shiftKm } from '@/domain/calculators/shift'
import type { Shift } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { toDayKey } from '@/domain/period'

export async function getOpenShift(): Promise<Shift | null> {
  return repos.shifts.findOpen()
}

/** Km final do último turno encerrado — sugestão de km inicial do próximo. */
export async function getLastKm(): Promise<number | null> {
  const last = await repos.shifts.findLastClosed()
  return last?.kmEnd ?? null
}

export async function startShift(kmStart: number, now = new Date()): Promise<Shift> {
  if (!Number.isFinite(kmStart) || kmStart < 0) throw new DomainError('invalid-km')
  if (await repos.shifts.findOpen()) throw new DomainError('shift-already-open')

  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) throw new DomainError('no-motorcycle')

  return repos.shifts.add({
    motorcycleId: motorcycle.id,
    day: toDayKey(now),
    startedAt: now.toISOString(),
    endedAt: null,
    kmStart,
    kmEnd: null,
    snapshot: null,
  })
}

/** Encerra o turno aberto e grava o snapshot dos cálculos (ADR-0009). */
export async function endShift(kmEnd: number, now = new Date()): Promise<Shift> {
  if (!Number.isFinite(kmEnd) || kmEnd < 0) throw new DomainError('invalid-km')

  const shift = await repos.shifts.findOpen()
  if (!shift) throw new DomainError('no-open-shift')

  const km = shiftKm({ kmStart: shift.kmStart, kmEnd })
  if (km === null) throw new DomainError('km-end-before-start')

  const [motorcycle, settings, fuelings, maintenanceItems] = await Promise.all([
    repos.motorcycles.get(shift.motorcycleId),
    repos.settings.get(),
    repos.fuelings.listByMotorcycle(shift.motorcycleId),
    repos.maintenanceItems.listByMotorcycle(shift.motorcycleId),
  ])
  if (!motorcycle) throw new DomainError('no-motorcycle')

  // Com itens de manutenção cadastrados, a reserva sai deles; senão, do valor por 100 km dos Ajustes.
  const perKmCents = maintenanceItems.length > 0 ? reservePerKmCents(maintenanceItems) : undefined

  const endedAt = now.toISOString()
  const closed: Shift = {
    ...shift,
    endedAt,
    kmEnd,
    snapshot: buildShiftSnapshot({
      km,
      motorcycle,
      settings,
      fuelings: fuelings.filter((fueling) => fueling.createdAt <= endedAt),
      maintenanceReservePerKmCents: perKmCents,
    }),
  }

  await repos.shifts.update(closed)
  return closed
}
