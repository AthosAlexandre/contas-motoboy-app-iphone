/**
 * Dias e períodos — ver docs/REGRAS-DE-NEGOCIO.md (Períodos).
 *
 * O dia é sempre uma string 'yyyy-MM-dd' no fuso de São Paulo. As contas de dias são feitas em UTC
 * sobre essa string, então não dependem do fuso do aparelho.
 */

export const APP_TIME_ZONE = 'America/Sao_Paulo'

export interface DayRange {
  from: string
  to: string
}

const dayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Dia ('yyyy-MM-dd') em São Paulo para um instante. */
export function toDayKey(instant: Date): string {
  const parts = Object.fromEntries(dayParts.formatToParts(instant).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function toUtcDate(day: string): Date {
  return new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))))
}

function fromUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(day: string, amount: number): string {
  const date = toUtcDate(day)
  date.setUTCDate(date.getUTCDate() + amount)
  return fromUtcDate(date)
}

export function dayRange(day: string): DayRange {
  return { from: day, to: day }
}

/** Soma meses mantendo o dia 1 (usado na navegação entre meses). */
export function addMonths(day: string, amount: number): string {
  const year = Number(day.slice(0, 4))
  const month = Number(day.slice(5, 7))
  return fromUtcDate(new Date(Date.UTC(year, month - 1 + amount, 1)))
}

/** Todos os dias do período, em ordem. */
export function eachDay(range: DayRange): string[] {
  const days: string[] = []
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) days.push(day)
  return days
}

/** Semana de segunda a domingo que contém o dia. */
export function weekRange(day: string): DayRange {
  const daysSinceMonday = (toUtcDate(day).getUTCDay() + 6) % 7
  const from = addDays(day, -daysSinceMonday)
  return { from, to: addDays(from, 6) }
}

/** Mês civil que contém o dia. */
export function monthRange(day: string): DayRange {
  const year = Number(day.slice(0, 4))
  const month = Number(day.slice(5, 7))
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const prefix = day.slice(0, 7)
  return { from: `${prefix}-01`, to: `${prefix}-${String(lastDay).padStart(2, '0')}` }
}

export function isDayInRange(day: string, range: DayRange): boolean {
  return day >= range.from && day <= range.to
}
