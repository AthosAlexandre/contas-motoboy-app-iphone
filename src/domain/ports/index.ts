/**
 * Ports: o que o domínio precisa da infraestrutura. Implementações em src/data (memória, Firestore).
 */
import type {
  AuthUser,
  Earning,
  Expense,
  Fueling,
  MaintenanceItem,
  MaintenanceRecord,
  Motorcycle,
  New,
  Platform,
  Settings,
  Shift,
} from '@/domain/entities'
import type { DomainError } from '@/domain/errors'
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
  update(earning: Earning): Promise<void>
  remove(id: string): Promise<void>
}

export interface ExpenseRepository {
  listByDayRange(range: DayRange): Promise<Expense[]>
  add(expense: New<Expense>): Promise<Expense>
  update(expense: Expense): Promise<void>
  remove(id: string): Promise<void>
}

export interface FuelingRepository {
  listByDayRange(range: DayRange): Promise<Fueling[]>
  listByMotorcycle(motorcycleId: string): Promise<Fueling[]>
  add(fueling: New<Fueling>): Promise<Fueling>
  update(fueling: Fueling): Promise<void>
  remove(id: string): Promise<void>
}

export interface PlatformRepository {
  /** Todas, ativas e inativas, na ordem. */
  list(): Promise<Platform[]>
  add(platform: New<Platform>): Promise<Platform>
  update(platform: Platform): Promise<void>
}

export interface MotorcycleRepository {
  getActive(): Promise<Motorcycle | null>
  get(id: string): Promise<Motorcycle | null>
  list(): Promise<Motorcycle[]>
  add(motorcycle: New<Motorcycle>): Promise<Motorcycle>
  update(motorcycle: Motorcycle): Promise<void>
  setActive(id: string): Promise<void>
}

export interface SettingsRepository {
  get(): Promise<Settings>
  save(settings: Settings): Promise<void>
}

export interface MaintenanceItemRepository {
  listByMotorcycle(motorcycleId: string): Promise<MaintenanceItem[]>
  add(item: New<MaintenanceItem>): Promise<MaintenanceItem>
  update(item: MaintenanceItem): Promise<void>
  remove(id: string): Promise<void>
}

export interface MaintenanceRecordRepository {
  listByMotorcycle(motorcycleId: string): Promise<MaintenanceRecord[]>
  add(record: New<MaintenanceRecord>): Promise<MaintenanceRecord>
}

export interface Repositories {
  shifts: ShiftRepository
  earnings: EarningRepository
  expenses: ExpenseRepository
  fuelings: FuelingRepository
  platforms: PlatformRepository
  motorcycles: MotorcycleRepository
  settings: SettingsRepository
  maintenanceItems: MaintenanceItemRepository
  maintenanceRecords: MaintenanceRecordRepository
}

export interface AuthService {
  /** Chama o listener com o estado atual assim que souber e a cada mudança. Retorna o "desinscrever". */
  onChange(listener: (user: AuthUser | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(name: string, email: string, password: string): Promise<void>
  /** Login com Google. Em produção a página sai para o Google e volta logada (redirecionamento). */
  signInWithGoogle(): Promise<void>
  /** Erro do retorno do login com Google, se houve (a página foi recarregada no meio). */
  redirectError(): Promise<DomainError | null>
  sendPasswordReset(email: string): Promise<void>
  signOut(): Promise<void>
}
