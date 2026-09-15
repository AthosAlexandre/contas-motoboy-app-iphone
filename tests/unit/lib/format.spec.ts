import { describe, expect, it } from 'vitest'

import { formatKm, formatKmPerLiter, formatLiters, formatMoney, formatRate, formatTime } from '@/lib/format'

// O Intl usa espaço não separável (U+00A0) entre "R$" e o valor.
const R$ = 'R$ '

describe('format', () => {
  it('dinheiro', () => {
    expect(formatMoney(18000)).toBe(`${R$}180,00`)
    expect(formatMoney(123456)).toBe(`${R$}1.234,56`)
    expect(formatMoney(-2870)).toBe(`-${R$}28,70`)
  })

  it('taxas com 3 ou 2 casas', () => {
    expect(formatRate(3500 / 8.437)).toBe(`${R$}4,148`)
    expect(formatRate(150, 2)).toBe(`${R$}1,50`)
  })

  it('km, litros e consumo', () => {
    expect(formatKm(1234)).toBe('1.234 km')
    expect(formatLiters(8.437)).toBe('8,437 l')
    expect(formatKmPerLiter(37.5)).toBe('37,5 km/l')
  })

  it('hora em São Paulo', () => {
    expect(formatTime('2026-09-15T11:30:00.000Z')).toBe('08:30')
  })
})
