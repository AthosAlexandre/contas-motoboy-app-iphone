/**
 * Casos de uso da moto: cadastrar/trocar, editar a ficha e ver o consumo medido.
 */
import { repos } from '@/data/container'
import { measuredKmPerLiter } from '@/domain/calculators/fuel'
import type { Motorcycle } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { normalizeMotorcycleInput, type MotorcycleInput } from '@/domain/validation'

/**
 * Cadastra uma moto e passa a usá-la. Se já havia uma ativa, ela é encerrada (`activeUntil`).
 * Turnos já encerrados não mudam (ADR-0009); km, consumo medido e manutenção são por moto.
 */
export async function registerMotorcycle(input: MotorcycleInput, now = new Date()): Promise<Motorcycle> {
  const data = normalizeMotorcycleInput(input)
  const activeFrom = now.toISOString()

  const current = await repos.motorcycles.getActive()
  if (current) await repos.motorcycles.update({ ...current, activeUntil: activeFrom })

  const created = await repos.motorcycles.add({ ...data, specsSource: 'manual', activeFrom, activeUntil: null })
  await repos.motorcycles.setActive(created.id)
  return created
}

/** Corrige a ficha da moto. Vale para os próximos turnos encerrados. */
export async function updateMotorcycle(id: string, input: MotorcycleInput): Promise<Motorcycle> {
  const current = await repos.motorcycles.get(id)
  if (!current) throw new DomainError('not-found')

  const updated: Motorcycle = { ...current, ...normalizeMotorcycleInput(input) }
  await repos.motorcycles.update(updated)
  return updated
}

export interface MeasuredConsumption {
  gasoline: number | null
  ethanol: number | null
}

export async function getMeasuredConsumption(motorcycleId: string): Promise<MeasuredConsumption> {
  const fuelings = await repos.fuelings.listByMotorcycle(motorcycleId)
  return {
    gasoline: measuredKmPerLiter(fuelings, 'gasoline'),
    ethanol: measuredKmPerLiter(fuelings, 'ethanol'),
  }
}
