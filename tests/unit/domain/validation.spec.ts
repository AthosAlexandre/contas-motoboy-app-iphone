import { describe, expect, it } from 'vitest'

import {
  assertPassword,
  normalizeEmail,
  normalizeMotorcycleInput,
  normalizePlatformName,
  validateSettings,
  type MotorcycleInput,
} from '@/domain/validation'

const input: MotorcycleInput = {
  brand: ' Honda ',
  model: ' CG 160 Fan ',
  year: 2024,
  fuelSupport: 'flex',
  kmPerLiterGasoline: 40,
  kmPerLiterEthanol: 28,
  tankLiters: 14,
  useMeasuredConsumption: true,
}

describe('normalizeMotorcycleInput', () => {
  it('limpa espaços', () => {
    expect(normalizeMotorcycleInput(input)).toMatchObject({ brand: 'Honda', model: 'CG 160 Fan' })
  })

  it('moto só a gasolina não guarda consumo de etanol', () => {
    expect(normalizeMotorcycleInput({ ...input, fuelSupport: 'gasoline' }).kmPerLiterEthanol).toBeNull()
  })

  it('consumo e tanque podem ficar em branco', () => {
    const result = normalizeMotorcycleInput({ ...input, kmPerLiterGasoline: null, kmPerLiterEthanol: null, tankLiters: null, year: null })
    expect(result.kmPerLiterGasoline).toBeNull()
  })

  it.each([
    [{ brand: '  ' }, 'invalid-motorcycle'],
    [{ model: '' }, 'invalid-motorcycle'],
    [{ year: 1800 }, 'invalid-year'],
    [{ kmPerLiterGasoline: 0 }, 'invalid-consumption'],
    [{ kmPerLiterEthanol: 400 }, 'invalid-consumption'],
    [{ tankLiters: 0 }, 'invalid-tank'],
  ] as const)('%o → %s', (override, code) => {
    expect(() => normalizeMotorcycleInput({ ...input, ...override })).toThrow(expect.objectContaining({ code }))
  })

  it('consumo de etanol inválido é ignorado em moto só a gasolina', () => {
    expect(() => normalizeMotorcycleInput({ ...input, fuelSupport: 'gasoline', kmPerLiterEthanol: 999 })).not.toThrow()
  })
})

describe('validateSettings', () => {
  const settings = { defaultGasolinePriceCents: 619.9, defaultEthanolPriceCents: 415, maintenanceReservePer100KmCents: 842 }

  it('aceita preço com fração (3 casas) e reserva inteira', () => {
    expect(validateSettings(settings)).toEqual(settings)
  })

  it.each([
    [{ defaultGasolinePriceCents: 0 }, 'invalid-price'],
    [{ defaultEthanolPriceCents: -1 }, 'invalid-price'],
    [{ maintenanceReservePer100KmCents: -1 }, 'invalid-reserve'],
    [{ maintenanceReservePer100KmCents: 8.5 }, 'invalid-reserve'],
  ] as const)('%o → %s', (override, code) => {
    expect(() => validateSettings({ ...settings, ...override })).toThrow(expect.objectContaining({ code }))
  })
})

describe('plataforma e credenciais', () => {
  it('nome da plataforma', () => {
    expect(normalizePlatformName('  Lalamove ')).toBe('Lalamove')
    expect(() => normalizePlatformName(' ')).toThrow(expect.objectContaining({ code: 'invalid-platform-name' }))
    expect(() => normalizePlatformName('x'.repeat(31))).toThrow(expect.objectContaining({ code: 'invalid-platform-name' }))
  })

  it('e-mail normalizado', () => {
    expect(normalizeEmail('  Athos@Email.com ')).toBe('athos@email.com')
    expect(() => normalizeEmail('athos@')).toThrow(expect.objectContaining({ code: 'invalid-email' }))
  })

  it('senha com pelo menos 6 caracteres', () => {
    expect(() => assertPassword('12345')).toThrow(expect.objectContaining({ code: 'invalid-password' }))
    expect(() => assertPassword('123456')).not.toThrow()
  })
})
