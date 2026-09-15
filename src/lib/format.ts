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
