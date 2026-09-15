import { describe, expect, it } from 'vitest'

import { costPerKmCents, fuelCostCents, pricePerLiterCents } from '@/domain/calculators/fuel'

// Exemplos de docs/REGRAS-DE-NEGOCIO.md

describe('pricePerLiterCents', () => {
  it('8,437 l de etanol por R$ 35,00 → R$ 4,148/l', () => {
    expect(pricePerLiterCents(3500, 8.437)).toBeCloseTo(414.84, 2)
  })

  it('sem litros ou sem valor não calcula', () => {
    expect(pricePerLiterCents(3500, 0)).toBeNull()
    expect(pricePerLiterCents(0, 8)).toBeNull()
  })
})

describe('fuelCostCents', () => {
  it('gasolina: 120 km ÷ 40 km/l × R$ 6,20 = R$ 18,60', () => {
    expect(fuelCostCents(120, 40, 620)).toBe(1860)
  })

  it('etanol: 120 km ÷ 28 km/l × R$ 4,15 = R$ 17,79 (arredonda para centavo inteiro)', () => {
    expect(fuelCostCents(120, 28, 415)).toBe(1779)
  })

  it('0 km custa zero', () => {
    expect(fuelCostCents(0, 40, 620)).toBe(0)
  })

  it('consumo ou preço inválido não calcula', () => {
    expect(fuelCostCents(120, 0, 620)).toBeNull()
    expect(fuelCostCents(120, 40, 0)).toBeNull()
    expect(fuelCostCents(-1, 40, 620)).toBeNull()
  })
})

describe('costPerKmCents (etanol ou gasolina?)', () => {
  it('gasolina R$ 6,20 ÷ 40 = R$ 0,155/km; etanol R$ 4,15 ÷ 28 = R$ 0,148/km → etanol compensa', () => {
    const gasolina = costPerKmCents(620, 40)
    const etanol = costPerKmCents(415, 28)

    expect(gasolina).toBeCloseTo(15.5, 2)
    expect(etanol).toBeCloseTo(14.82, 2)
    expect(etanol!).toBeLessThan(gasolina!)
  })

  it('sem consumo não calcula', () => {
    expect(costPerKmCents(620, 0)).toBeNull()
  })
})
