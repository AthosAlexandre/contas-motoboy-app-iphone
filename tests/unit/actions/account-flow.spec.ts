import { beforeEach, describe, expect, it } from 'vitest'

import { currentUser, googleRedirectError, signIn, signInWithGoogle, signOut, signUp } from '@/actions/auth'
import { getMeasuredConsumption, registerMotorcycle, updateMotorcycle } from '@/actions/motorcycle'
import { getActiveMotorcycle } from '@/actions/reference'
import { addPlatform, getSettings, listAllPlatforms, saveSettings, setPlatformActive } from '@/actions/settings'
import { addFueling } from '@/actions/entries'
import { endShift, startShift } from '@/actions/shifts'
import { setAuth, setRepos } from '@/data/container'
import { createMemoryAuth } from '@/data/auth/memoryAuth'
import { createMemoryRepos } from '@/data/memory/repositories'
import type { MotorcycleInput } from '@/domain/validation'

const cg160: MotorcycleInput = {
  brand: 'Honda',
  model: 'CG 160 Fan',
  year: 2024,
  fuelSupport: 'flex',
  kmPerLiterGasoline: 42,
  kmPerLiterEthanol: 29,
  tankLiters: 14,
  useMeasuredConsumption: true,
}

beforeEach(() => {
  setRepos(createMemoryRepos(undefined, { exampleMotorcycle: false }))
})

describe('minha moto', () => {
  it('conta nova começa sem moto e não inicia turno', async () => {
    expect(await getActiveMotorcycle()).toBeNull()
    await expect(startShift(1000)).rejects.toMatchObject({ code: 'no-motorcycle' })
  })

  it('cadastrar a primeira moto a torna ativa', async () => {
    const moto = await registerMotorcycle(cg160, new Date('2026-09-15T12:00:00Z'))
    expect(await getActiveMotorcycle()).toEqual(moto)
    expect(moto).toMatchObject({ activeFrom: '2026-09-15T12:00:00.000Z', activeUntil: null, specsSource: 'manual' })
  })

  it('trocar de moto encerra a anterior e não mexe no turno já encerrado (ADR-0009)', async () => {
    const first = await registerMotorcycle(cg160, new Date('2026-09-01T12:00:00Z'))
    await startShift(1000, new Date('2026-09-02T11:00:00Z'))
    const closed = await endShift(1120, new Date('2026-09-02T21:00:00Z'))

    const second = await registerMotorcycle(
      { ...cg160, model: 'Fazer 250', fuelSupport: 'gasoline', kmPerLiterGasoline: 30 },
      new Date('2026-09-10T12:00:00Z'),
    )

    expect((await getActiveMotorcycle())?.id).toBe(second.id)
    expect(second.kmPerLiterEthanol).toBeNull()
    expect(closed.motorcycleId).toBe(first.id)
    expect(closed.snapshot?.kmPerLiterUsed).toBe(42)
  })

  it('editar a ficha vale para a moto ativa', async () => {
    const moto = await registerMotorcycle(cg160)
    const updated = await updateMotorcycle(moto.id, { ...cg160, kmPerLiterGasoline: 38 })
    expect(updated.kmPerLiterGasoline).toBe(38)
    expect((await getActiveMotorcycle())?.kmPerLiterGasoline).toBe(38)
  })

  it('consumo medido por combustível', async () => {
    const moto = await registerMotorcycle(cg160)
    await addFueling({ fuelType: 'gasoline', totalCents: 5000, liters: 8, odometerKm: 1000, fullTank: true }, new Date('2026-09-15T10:00:00Z'))
    await addFueling({ fuelType: 'gasoline', totalCents: 3000, liters: 5, odometerKm: 1200, fullTank: true }, new Date('2026-09-16T10:00:00Z'))
    expect(await getMeasuredConsumption(moto.id)).toEqual({ gasoline: 40, ethanol: null })
  })
})

describe('ajustes', () => {
  it('salva preços e reserva', async () => {
    await saveSettings({ defaultGasolinePriceCents: 619.9, defaultEthanolPriceCents: 429, maintenanceReservePer100KmCents: 900 })
    expect(await getSettings()).toEqual({ defaultGasolinePriceCents: 619.9, defaultEthanolPriceCents: 429, maintenanceReservePer100KmCents: 900 })
  })

  it('recusa preço zero', async () => {
    await expect(
      saveSettings({ defaultGasolinePriceCents: 0, defaultEthanolPriceCents: 429, maintenanceReservePer100KmCents: 900 }),
    ).rejects.toMatchObject({ code: 'invalid-price' })
  })

  it('plataformas: adiciona no fim, recusa repetida e desativa', async () => {
    const lalamove = await addPlatform(' Lalamove ')
    expect(lalamove).toMatchObject({ name: 'Lalamove', isActive: true, order: 3 })
    await expect(addPlatform('ifood')).rejects.toMatchObject({ code: 'duplicate-platform' })

    await setPlatformActive(lalamove, false)
    const all = await listAllPlatforms()
    expect(all.map((platform) => [platform.name, platform.isActive])).toEqual([
      ['iFood', true],
      ['99Food', true],
      ['Lalamove', false],
    ])
  })
})

describe('conta (login local)', () => {
  it('sair e entrar de novo atualiza a sessão', async () => {
    setAuth(createMemoryAuth())
    expect(currentUser()?.uid).toBe('local')

    await signOut()
    expect(currentUser()).toBeNull()

    await signIn(' Athos@Email.com ', 'qualquer')
    expect(currentUser()?.email).toBe('athos@email.com')
  })

  it('cadastro valida nome, e-mail e senha', async () => {
    setAuth(createMemoryAuth(null))
    await expect(signUp(' ', 'a@b.com', '123456')).rejects.toMatchObject({ code: 'invalid-name' })
    await expect(signUp('Athos', 'a@b', '123456')).rejects.toMatchObject({ code: 'invalid-email' })
    await expect(signUp('Athos', 'a@b.com', '123')).rejects.toMatchObject({ code: 'invalid-password' })

    await signUp('Athos', 'a@b.com', '123456')
    expect(currentUser()).toMatchObject({ name: 'Athos', email: 'a@b.com' })
  })

  it('entrar com Google só termina com a sessão aberta', async () => {
    setAuth(createMemoryAuth(null))
    await signInWithGoogle()
    expect(currentUser()).not.toBeNull()
    expect(await googleRedirectError()).toBeNull()
  })
})
