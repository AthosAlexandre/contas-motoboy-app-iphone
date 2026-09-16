/**
 * Formatação para exibição (pt-BR). Helpers puros de UI — não importam nada do app.
 */

/** Mesmo fuso de domain/period.ts (lib não importa domain). */
const TIME_ZONE = 'America/Sao_Paulo'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const liters = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })
const time = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })

/** Centavos inteiros → "R$ 180,00". */
export function formatMoney(cents: number): string {
  return money.format(cents / 100)
}

/** Taxa em centavos com fração → "R$ 4,148" (preço por litro) ou "R$ 1,50" com `fractionDigits = 2`. */
export function formatRate(cents: number, fractionDigits = 3): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100)
}

export function formatKm(km: number): string {
  return `${integer.format(km)} km`
}

export function formatLiters(value: number): string {
  return `${liters.format(value)} l`
}

export function formatKmPerLiter(value: number): string {
  return `${oneDecimal.format(value)} km/l`
}

/** Instante ISO → "08:30" no horário de São Paulo. */
export function formatTime(iso: string): string {
  return time.format(new Date(iso))
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** 'yyyy-MM-dd' → "15/09". */
export function formatDayLabel(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`
}

/** 'yyyy-MM-dd' → "Setembro de 2026" (ou "set/26" no formato curto). */
export function formatMonthLabel(day: string, short = false): string {
  const month = Number(day.slice(5, 7)) - 1
  const year = day.slice(0, 4)
  return short ? `${SHORT_MONTHS[month] ?? ''}/${year.slice(2)}` : `${MONTHS[month] ?? ''} de ${year}`
}

/** Período → "14 a 20/09". */
export function formatRangeLabel(from: string, to: string): string {
  return from === to ? formatDayLabel(from) : `${from.slice(8, 10)} a ${formatDayLabel(to)}`
}

/** 0.42 → "42%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}
