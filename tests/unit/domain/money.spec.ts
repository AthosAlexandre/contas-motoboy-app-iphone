import { describe, expect, it } from 'vitest'

import { parseMoney } from '@/domain/money'

describe('parseMoney', () => {
  it.each([
    ['145,90', 14590],
    ['145,9', 14590],
    ['145', 14500],
    ['R$ 145,90', 14590],
    ['r$145,90', 14590],
    ['1.234,56', 123456],
    ['1.234', 123400],
    ['12.345.678,00', 1234567800],
    ['145.90', 14590],
    ['0,05', 5],
    ['R$ 35,00', 3500],
  ])('"%s" → %i centavos', (input, expected) => {
    expect(parseMoney(input)).toBe(expected)
  })

  it.each(['', 'abc', '-10,00', '10,999', '1,2,3', '12.34.56', 'R$'])('"%s" é inválido', (input) => {
    expect(parseMoney(input)).toBeNull()
  })
})
