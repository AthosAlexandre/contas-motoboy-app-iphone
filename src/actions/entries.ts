/**
 * Casos de uso dos lançamentos: ganho, gasto e abastecimento.
 */
import { repos } from '@/data/container'
import { pricePerLiterCents } from '@/domain/calculators/fuel'
import type { Earning, Expense, ExpenseCategory, FuelType, Fueling } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { toDayKey, type DayRange } from '@/domain/period'

export type EntryKind = 'earning' | 'expense' | 'fueling'

export interface DayEntries {
  earnings: Earning[]
  expenses: Expense[]
  fuelings: Fueling[]
}

function assertAmount(cents: number): void {
  if (!Number.isInteger(cents) || cents <= 0) throw new DomainError('invalid-amount')
}

export interface EarningInput {
  platformId: string
  amountCents: number
  tipCents: number
}

/** Ganho do dia; se houver turno aberto, fica ligado a ele. */
export async function addEarning(input: EarningInput, now = new Date()): Promise<Earning> {
  assertAmount(input.amountCents)
  if (!Number.isInteger(input.tipCents) || input.tipCents < 0) throw new DomainError('invalid-tip')

  const openShift = await repos.shifts.findOpen()
  return repos.earnings.add({
    ...input,
    day: toDayKey(now),
    createdAt: now.toISOString(),
    shiftId: openShift?.id ?? null,
    source: 'manual',
  })
}

export interface ExpenseInput {
  category: ExpenseCategory
  amountCents: number
  description: string
}

export async function addExpense(input: ExpenseInput, now = new Date()): Promise<Expense> {
  assertAmount(input.amountCents)
  return repos.expenses.add({
    ...input,
    description: input.description.trim(),
    day: toDayKey(now),
    createdAt: now.toISOString(),
    source: 'manual',
  })
}

export interface FuelingInput {
  fuelType: FuelType
  totalCents: number
  liters: number
  odometerKm: number | null
  fullTank: boolean
}

/** Abastecimento com valor total e litros; o preço por litro é calculado. */
export async function addFueling(input: FuelingInput, now = new Date()): Promise<Fueling> {
  assertAmount(input.totalCents)
  if (!(input.liters > 0)) throw new DomainError('invalid-liters')
  if (input.odometerKm !== null && !(input.odometerKm >= 0)) throw new DomainError('invalid-km')

  const motorcycle = await repos.motorcycles.getActive()
  if (!motorcycle) throw new DomainError('no-motorcycle')
  if (input.fuelType === 'ethanol' && motorcycle.fuelSupport !== 'flex') throw new DomainError('fuel-not-supported')

  return repos.fuelings.add({
    ...input,
    motorcycleId: motorcycle.id,
    pricePerLiterCents: pricePerLiterCents(input.totalCents, input.liters) ?? 0,
    day: toDayKey(now),
    createdAt: now.toISOString(),
    source: 'manual',
  })
}

export async function listEntries(range: DayRange): Promise<DayEntries> {
  const [earnings, expenses, fuelings] = await Promise.all([
    repos.earnings.listByDayRange(range),
    repos.expenses.listByDayRange(range),
    repos.fuelings.listByDayRange(range),
  ])
  return { earnings, expenses, fuelings }
}

export async function removeEntry(kind: EntryKind, id: string): Promise<void> {
  if (kind === 'earning') return repos.earnings.remove(id)
  if (kind === 'expense') return repos.expenses.remove(id)
  return repos.fuelings.remove(id)
}
