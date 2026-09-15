/**
 * Ports: o que o domínio precisa da infraestrutura. Implementações em src/data (memória, Firestore).
 */
import type { Earning, Expense, Fueling, Motorcycle, New, Platform, Settings, Shift } from '@/domain/entities'
import type { DayRange } from '@/domain/period'

export interface ShiftRepository {
  findOpen(): Promise<Shift | null>
  findLastClosed(): Promise<Shift | null>
  listByDayRange(range: DayRange): Promise<Shift[]>
  add(shift: New<Shift>): Promise<Shift>
  update(shift: Shift): Promise<void>
}

export interface EarningRepository {
  listByDayRange(range: DayRange): Promise<Earning[]>
  add(earning: New<Earning>): Promise<Earning>
  remove(id: string): Promise<void>
}

export interface ExpenseRepository {
  listByDayRange(range: DayRange): Promise<Expense[]>
  add(expense: New<Expense>): Promise<Expense>
  remove(id: string): Promise<void>
}

export interface FuelingRepository {
  listByDayRange(range: DayRange): Promise<Fueling[]>
  listByMotorcycle(motorcycleId: string): Promise<Fueling[]>
  add(fueling: New<Fueling>): Promise<Fueling>
  remove(id: string): Promise<void>
}

export interface PlatformRepository {
  list(): Promise<Platform[]>
}

export interface MotorcycleRepository {
  getActive(): Promise<Motorcycle | null>
  get(id: string): Promise<Motorcycle | null>
}

export interface SettingsRepository {
  get(): Promise<Settings>
}

export interface Repositories {
  shifts: ShiftRepository
  earnings: EarningRepository
  expenses: ExpenseRepository
  fuelings: FuelingRepository
  platforms: PlatformRepository
  motorcycles: MotorcycleRepository
  settings: SettingsRepository
}
