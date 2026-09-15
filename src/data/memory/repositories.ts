/**
 * Repositórios locais (memória + storage opcional) — implementam as ports do domain.
 */
import { DEFAULT_PLATFORMS, DEFAULT_SETTINGS } from '@/domain/defaults'
import type { Earning, Expense, Fueling, Motorcycle, Platform, Settings, Shift } from '@/domain/entities'
import { isDayInRange } from '@/domain/period'
import type { Repositories } from '@/domain/ports'

import { MemoryCollection, type KeyValueStorage } from './collection'
import { SEED_MOTORCYCLE } from './seed'

const KEY_PREFIX = 'mc:v1:'

interface Profile {
  id: string
  activeMotorcycleId: string | null
}

export interface MemoryReposOptions {
  /** Começa com a moto de exemplo ativa (padrão). `false` = conta sem moto, como um usuário novo. */
  exampleMotorcycle?: boolean
}

function byCreatedAt(a: { createdAt: string }, b: { createdAt: string }): number {
  return a.createdAt.localeCompare(b.createdAt)
}

export function createMemoryRepos(storage?: KeyValueStorage, options: MemoryReposOptions = {}): Repositories {
  const withExample = options.exampleMotorcycle ?? true

  const shifts = new MemoryCollection<Shift>(`${KEY_PREFIX}shifts`, storage)
  const earnings = new MemoryCollection<Earning>(`${KEY_PREFIX}earnings`, storage)
  const expenses = new MemoryCollection<Expense>(`${KEY_PREFIX}expenses`, storage)
  const fuelings = new MemoryCollection<Fueling>(`${KEY_PREFIX}fuelings`, storage)
  const platforms = new MemoryCollection<Platform>(`${KEY_PREFIX}platforms`, storage, DEFAULT_PLATFORMS)
  const motorcycles = new MemoryCollection<Motorcycle>(
    `${KEY_PREFIX}motorcycles`,
    storage,
    withExample ? [SEED_MOTORCYCLE] : [],
  )
  const profile = new MemoryCollection<Profile>(`${KEY_PREFIX}profile`, storage, [
    { id: 'profile', activeMotorcycleId: withExample ? SEED_MOTORCYCLE.id : null },
  ])
  const settings = new MemoryCollection<Settings & { id: string }>(`${KEY_PREFIX}settings`, storage, [
    { id: 'settings', ...DEFAULT_SETTINGS },
  ])

  return {
    shifts: {
      async findOpen() {
        return shifts.all().find((shift) => shift.endedAt === null) ?? null
      },
      async findLastClosed() {
        const closed = shifts.all().filter((shift) => shift.endedAt !== null)
        return closed.sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))[0] ?? null
      },
      async listByDayRange(range) {
        return shifts
          .all()
          .filter((shift) => isDayInRange(shift.day, range))
          .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      },
      async add(input) {
        return shifts.add(input)
      },
      async update(shift) {
        shifts.update(shift)
      },
    },

    earnings: {
      async listByDayRange(range) {
        return earnings.all().filter((earning) => isDayInRange(earning.day, range)).sort(byCreatedAt)
      },
      async add(input) {
        return earnings.add(input)
      },
      async remove(id) {
        earnings.remove(id)
      },
    },

    expenses: {
      async listByDayRange(range) {
        return expenses.all().filter((expense) => isDayInRange(expense.day, range)).sort(byCreatedAt)
      },
      async add(input) {
        return expenses.add(input)
      },
      async remove(id) {
        expenses.remove(id)
      },
    },

    fuelings: {
      async listByDayRange(range) {
        return fuelings.all().filter((fueling) => isDayInRange(fueling.day, range)).sort(byCreatedAt)
      },
      async listByMotorcycle(motorcycleId) {
        return fuelings.all().filter((fueling) => fueling.motorcycleId === motorcycleId).sort(byCreatedAt)
      },
      async add(input) {
        return fuelings.add(input)
      },
      async remove(id) {
        fuelings.remove(id)
      },
    },

    platforms: {
      async list() {
        return platforms.all().sort((a, b) => a.order - b.order)
      },
      async add(input) {
        return platforms.add(input)
      },
      async update(platform) {
        platforms.update(platform)
      },
    },

    motorcycles: {
      async getActive() {
        const activeId = profile.all()[0]?.activeMotorcycleId
        return activeId ? motorcycles.find(activeId) : null
      },
      async get(id) {
        return motorcycles.find(id)
      },
      async list() {
        return motorcycles.all().sort((a, b) => a.activeFrom.localeCompare(b.activeFrom))
      },
      async add(input) {
        return motorcycles.add(input)
      },
      async update(motorcycle) {
        motorcycles.update(motorcycle)
      },
      async setActive(id) {
        profile.update({ id: 'profile', activeMotorcycleId: id })
      },
    },

    settings: {
      async get() {
        const stored = settings.all()[0]
        if (!stored) return { ...DEFAULT_SETTINGS }
        return {
          defaultGasolinePriceCents: stored.defaultGasolinePriceCents,
          defaultEthanolPriceCents: stored.defaultEthanolPriceCents,
          maintenanceReservePer100KmCents: stored.maintenanceReservePer100KmCents,
        }
      },
      async save(values) {
        settings.update({ id: 'settings', ...values })
      },
    },
  }
}
