import { describe, expect, it } from 'vitest'

import { addDays, isDayInRange, monthRange, toDayKey, weekRange } from '@/domain/period'

describe('toDayKey (fuso de São Paulo)', () => {
  it('23h30 em São Paulo ainda é o mesmo dia, mesmo já sendo o dia seguinte em UTC', () => {
    expect(toDayKey(new Date('2026-09-16T02:30:00Z'))).toBe('2026-09-15')
  })

  it('meio-dia em São Paulo', () => {
    expect(toDayKey(new Date('2026-09-15T15:00:00Z'))).toBe('2026-09-15')
  })
})

describe('addDays', () => {
  it('vira o mês e o ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('weekRange (segunda a domingo)', () => {
  it.each([
    ['2026-09-14', 'segunda'],
    ['2026-09-15', 'terça'],
    ['2026-09-20', 'domingo'],
  ])('%s (%s) → 14 a 20/09', (day) => {
    expect(weekRange(day)).toEqual({ from: '2026-09-14', to: '2026-09-20' })
  })

  it('semana que atravessa o mês', () => {
    expect(weekRange('2026-10-01')).toEqual({ from: '2026-09-28', to: '2026-10-04' })
  })
})

describe('monthRange', () => {
  it.each([
    ['2026-02-10', { from: '2026-02-01', to: '2026-02-28' }],
    ['2028-02-10', { from: '2028-02-01', to: '2028-02-29' }],
    ['2026-09-15', { from: '2026-09-01', to: '2026-09-30' }],
  ])('%s', (day, expected) => {
    expect(monthRange(day)).toEqual(expected)
  })
})

describe('isDayInRange', () => {
  it('inclui as pontas', () => {
    const range = { from: '2026-09-14', to: '2026-09-20' }
    expect(isDayInRange('2026-09-14', range)).toBe(true)
    expect(isDayInRange('2026-09-20', range)).toBe(true)
    expect(isDayInRange('2026-09-21', range)).toBe(false)
  })
})
