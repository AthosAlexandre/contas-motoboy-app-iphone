import { describe, expect, it } from 'vitest'

import { numberOr, toEntity, withoutId } from '@/data/firestore/mappers'

describe('mappers do Firestore', () => {
  it('o id não vai para o documento', () => {
    expect(withoutId({ id: 'abc', name: 'iFood', order: 1 })).toEqual({ name: 'iFood', order: 1 })
  })

  it('o id do documento volta para a entidade', () => {
    expect(toEntity<{ id: string; name: string }>('abc', { name: 'iFood' })).toEqual({ id: 'abc', name: 'iFood' })
  })

  it('campos ausentes ou inválidos caem no padrão', () => {
    expect(numberOr(undefined, 620)).toBe(620)
    expect(numberOr('6,20', 620)).toBe(620)
    expect(numberOr(Number.NaN, 620)).toBe(620)
    expect(numberOr(619.9, 620)).toBe(619.9)
  })
})
