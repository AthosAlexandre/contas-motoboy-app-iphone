/**
 * Entidades do domínio — ver docs/REGRAS-DE-NEGOCIO.md.
 *
 * - `day`: dia do lançamento no formato 'yyyy-MM-dd', no fuso de São Paulo (ver period.ts).
 * - `createdAt`, `startedAt`, `endedAt`: instantes em ISO 8601 (UTC).
 * - Dinheiro em centavos inteiros; taxas (preço por litro) em centavos com fração (ADR-0007).
 */

export type FuelType = 'gasoline' | 'ethanol'
export type FuelSupport = 'flex' | 'gasoline'
export type EntrySource = 'manual' | 'ai'

/** Gastos diretos. Combustível entra por `Fueling`; manutenção paga sai da reserva (Sprint 4). */
export type ExpenseCategory = 'food' | 'phone' | 'equipment' | 'fine' | 'other'

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Alimentação',
  phone: 'Celular/internet',
  equipment: 'Equipamento',
  fine: 'Multa',
  other: 'Outros',
}

/** Entidade sem o `id` — o repositório gera o id ao salvar. */
export type New<T extends { id: string }> = Omit<T, 'id'>

export interface Platform {
  id: string
  name: string
  isActive: boolean
  order: number
}

export interface Motorcycle {
  id: string
  brand: string
  model: string
  year: number | null
  fuelSupport: FuelSupport
  /** Consumo da ficha (IA ou digitado). `null` = não informado. */
  kmPerLiterGasoline: number | null
  kmPerLiterEthanol: number | null
  tankLiters: number | null
  /** Usar o consumo medido (tanque cheio) quando houver. */
  useMeasuredConsumption: boolean
  specsSource: EntrySource
  /** Vigência: trocar de moto encerra a anterior (`activeUntil`) e começa a nova (ADR-0009). */
  activeFrom: string
  activeUntil: string | null
}

/** Usuário logado. */
export interface AuthUser {
  uid: string
  name: string
  email: string
}

export interface Settings {
  /** Preço padrão por litro (taxa, centavos com fração) quando não há abastecimento daquele combustível. */
  defaultGasolinePriceCents: number
  defaultEthanolPriceCents: number
  /** Reserva de manutenção por 100 km quando não há itens de manutenção cadastrados. */
  maintenanceReservePer100KmCents: number
}

/** Valores usados no cálculo quando o turno foi encerrado — relatórios leem daqui (ADR-0009). */
export interface ShiftSnapshot {
  fuelTypeUsed: FuelType
  kmPerLiterUsed: number | null
  fuelPriceCentsUsed: number
  /** `null` quando o consumo do combustível não estava informado. */
  fuelCostCents: number | null
  maintenanceReserveCents: number
}

export interface Shift {
  id: string
  motorcycleId: string
  day: string
  startedAt: string
  endedAt: string | null
  kmStart: number
  kmEnd: number | null
  snapshot: ShiftSnapshot | null
}

export interface Earning {
  id: string
  platformId: string
  amountCents: number
  tipCents: number
  day: string
  createdAt: string
  shiftId: string | null
  source: EntrySource
}

export interface Expense {
  id: string
  category: ExpenseCategory
  amountCents: number
  description: string
  day: string
  createdAt: string
  source: EntrySource
}

export interface Fueling {
  id: string
  motorcycleId: string
  fuelType: FuelType
  totalCents: number
  liters: number
  pricePerLiterCents: number
  odometerKm: number | null
  fullTank: boolean
  day: string
  createdAt: string
  source: EntrySource
}
