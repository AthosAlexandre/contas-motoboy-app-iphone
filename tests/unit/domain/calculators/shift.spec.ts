import { describe, expect, it } from 'vitest'

import { buildShiftSnapshot, shiftKm } from '@/domain/calculators/shift'
import { fueling, motorcycle, settings } from '../factories'

const at = (minute: number) => `2026-09-15T10:${String(minute).padStart(2, '0')}:00.000Z`

describe('shiftKm', () => {
  it('km final − km inicial', () => {
    expect(shiftKm({ kmStart: 1000, kmEnd: 1120 })).toBe(120)
  })

  it('turno aberto ou km final menor → null', () => {
    expect(shiftKm({ kmStart: 1000, kmEnd: null })).toBeNull()
    expect(shiftKm({ kmStart: 1000, kmEnd: 990 })).toBeNull()
  })
})

describe('buildShiftSnapshot', () => {
  it('sem abastecimentos: gasolina, consumo da ficha e preço padrão (REGRAS: 120 km → R$ 18,60 + R$ 10,10)', () => {
    const snapshot = buildShiftSnapshot({ km: 120, motorcycle: motorcycle(), fuelings: [], settings })
    expect(snapshot).toEqual({
      fuelTypeUsed: 'gasoline',
      kmPerLiterUsed: 40,
      fuelPriceCentsUsed: 620,
      fuelCostCents: 1860,
      maintenanceReserveCents: 1010,
    })
  })

  it('usa o combustível e o preço do último abastecimento (etanol R$ 35,00 / 8,437 l)', () => {
    const list = [fueling({ fuelType: 'ethanol', totalCents: 3500, liters: 8.437, pricePerLiterCents: 3500 / 8.437 })]
    const snapshot = buildShiftSnapshot({ km: 120, motorcycle: motorcycle(), fuelings: list, settings })
    expect(snapshot.fuelTypeUsed).toBe('ethanol')
    expect(snapshot.kmPerLiterUsed).toBe(28)
    expect(snapshot.fuelPriceCentsUsed).toBeCloseTo(414.84, 2)
    expect(snapshot.fuelCostCents).toBe(1778)
  })

  it('prefere o consumo medido quando a moto usa medição', () => {
    const list = [
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 1000 }),
      fueling({ createdAt: at(2), fullTank: true, odometerKm: 1225, liters: 5 }), // 45 km/l
    ]
    const snapshot = buildShiftSnapshot({ km: 120, motorcycle: motorcycle(), fuelings: list, settings })
    expect(snapshot.kmPerLiterUsed).toBe(45)
    expect(snapshot.fuelCostCents).toBe(1653)
  })

  it('com medição desligada, usa a ficha', () => {
    const list = [
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 1000 }),
      fueling({ createdAt: at(2), fullTank: true, odometerKm: 1225, liters: 5 }),
    ]
    const snapshot = buildShiftSnapshot({
      km: 120,
      motorcycle: motorcycle({ useMeasuredConsumption: false }),
      fuelings: list,
      settings,
    })
    expect(snapshot.kmPerLiterUsed).toBe(40)
  })

  it('moto só a gasolina ignora etanol', () => {
    const list = [fueling({ fuelType: 'ethanol', pricePerLiterCents: 415 })]
    const snapshot = buildShiftSnapshot({
      km: 120,
      motorcycle: motorcycle({ fuelSupport: 'gasoline', kmPerLiterEthanol: null }),
      fuelings: list,
      settings,
    })
    expect(snapshot.fuelTypeUsed).toBe('gasoline')
    expect(snapshot.fuelPriceCentsUsed).toBe(620)
  })

  it('consumo não informado → custo de combustível null (reserva continua)', () => {
    const list = [fueling({ fuelType: 'ethanol', pricePerLiterCents: 415 })]
    const snapshot = buildShiftSnapshot({
      km: 120,
      motorcycle: motorcycle({ kmPerLiterEthanol: null }),
      fuelings: list,
      settings,
    })
    expect(snapshot.kmPerLiterUsed).toBeNull()
    expect(snapshot.fuelCostCents).toBeNull()
    expect(snapshot.maintenanceReserveCents).toBe(1010)
  })

  it('reserva pelos itens de manutenção quando informada', () => {
    const snapshot = buildShiftSnapshot({
      km: 100,
      motorcycle: motorcycle(),
      fuelings: [],
      settings,
      maintenanceReservePerKmCents: 5,
    })
    expect(snapshot.maintenanceReserveCents).toBe(500)
  })
})
