import { describe, expect, it } from 'vitest'

import { parseDecimal } from '@/domain/numbers'

describe('parseDecimal', () => {
  it.each([
    ['8,437', 8.437],
    ['8.437', 8.437],
    ['40', 40],
    [' 28,5 ', 28.5],
  ])('"%s" → %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })

  it.each(['', 'abc', '-3', '1.234,5', '8,'])('"%s" é inválido', (input) => {
    expect(parseDecimal(input)).toBeNull()
  })
})
