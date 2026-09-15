import { describe, expect, it } from 'vitest'

import { latestFueling, measuredKmPerLiter } from '@/domain/calculators/fuel'
import { fueling } from '../factories'

const at = (minute: number) => `2026-09-15T10:${String(minute).padStart(2, '0')}:00.000Z`

describe('measuredKmPerLiter (tanque cheio, por combustível)', () => {
  it('soma os litros do intervalo, inclusive abastecimento parcial no meio', () => {
    const list = [
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 1000, liters: 10 }),
      fueling({ createdAt: at(2), fullTank: false, odometerKm: null, liters: 2 }),
      fueling({ createdAt: at(3), fullTank: true, odometerKm: 1300, liters: 6 }),
    ]
    // 300 km ÷ (2 + 6) l
    expect(measuredKmPerLiter(list, 'gasoline')).toBe(37.5)
  })

  it('ignora a ordem de chegada: usa a ordem cronológica', () => {
    const list = [
      fueling({ createdAt: at(3), fullTank: true, odometerKm: 1200, liters: 5 }),
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 1000, liters: 9 }),
    ]
    expect(measuredKmPerLiter(list, 'gasoline')).toBe(40)
  })

  it('tanque misturado (gasolina → etanol) fica fora das duas médias', () => {
    const list = [
      fueling({ createdAt: at(1), fuelType: 'gasoline', fullTank: true, odometerKm: 1000 }),
      fueling({ createdAt: at(2), fuelType: 'ethanol', fullTank: true, odometerKm: 1150, liters: 5 }),
    ]
    expect(measuredKmPerLiter(list, 'gasoline')).toBeNull()
    expect(measuredKmPerLiter(list, 'ethanol')).toBeNull()
  })

  it('mede cada combustível só nos seus intervalos', () => {
    const list = [
      fueling({ createdAt: at(1), fuelType: 'ethanol', fullTank: true, odometerKm: 1000 }),
      fueling({ createdAt: at(2), fuelType: 'ethanol', fullTank: true, odometerKm: 1140, liters: 5 }),
    ]
    expect(measuredKmPerLiter(list, 'ethanol')).toBe(28)
    expect(measuredKmPerLiter(list, 'gasoline')).toBeNull()
  })

  it('tanque cheio sem odômetro não fecha intervalo, mas os litros contam no seguinte', () => {
    const list = [
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 1000 }),
      fueling({ createdAt: at(2), fullTank: true, odometerKm: null, liters: 4 }),
      fueling({ createdAt: at(3), fullTank: true, odometerKm: 1360, liters: 5 }),
    ]
    // 360 km ÷ (4 + 5) l
    expect(measuredKmPerLiter(list, 'gasoline')).toBe(40)
  })

  it('média ponderada dos últimos 3 intervalos', () => {
    const list = [
      fueling({ createdAt: at(1), fullTank: true, odometerKm: 0 }),
      fueling({ createdAt: at(2), fullTank: true, odometerKm: 100, liters: 10 }), // 10 km/l (fica de fora)
      fueling({ createdAt: at(3), fullTank: true, odometerKm: 500, liters: 10 }), // 40
      fueling({ createdAt: at(4), fullTank: true, odometerKm: 900, liters: 10 }), // 40
      fueling({ createdAt: at(5), fullTank: true, odometerKm: 1300, liters: 10 }), // 40
    ]
    expect(measuredKmPerLiter(list, 'gasoline')).toBe(40)
  })

  it('sem dois tanques cheios não há medição', () => {
    expect(measuredKmPerLiter([], 'gasoline')).toBeNull()
    expect(measuredKmPerLiter([fueling({ fullTank: true, odometerKm: 1000 })], 'gasoline')).toBeNull()
  })
})

describe('latestFueling', () => {
  it('último por data, opcionalmente de um combustível', () => {
    const gas = fueling({ createdAt: at(1), fuelType: 'gasoline' })
    const eth = fueling({ createdAt: at(2), fuelType: 'ethanol' })
    expect(latestFueling([eth, gas])).toBe(eth)
    expect(latestFueling([eth, gas], 'gasoline')).toBe(gas)
    expect(latestFueling([])).toBeNull()
  })
})
