/**
 * Cálculos de combustível — ver docs/REGRAS-DE-NEGOCIO.md (Abastecimento, Consumo médio,
 * Custo de combustível, Etanol ou gasolina?).
 *
 * Preço por litro e custo por km são TAXAS em centavos e podem ter fração (R$ 6,199/l = 619.9);
 * só valores em dinheiro (totais) são centavos inteiros.
 */
import type { FuelType, Fueling } from '@/domain/entities'

/** Quantos intervalos de tanque cheio entram na média do consumo medido. */
export const MEASURED_INTERVALS = 3

/** Preço por litro (centavos, com fração) a partir do valor total pago e dos litros colocados. */
export function pricePerLiterCents(totalCents: number, liters: number): number | null {
  if (totalCents <= 0 || liters <= 0) return null
  return totalCents / liters
}

/** Custo estimado (centavos inteiros) para rodar `km` com o consumo e o preço informados. */
export function fuelCostCents(km: number, kmPerLiter: number, pricePerLiterCents: number): number | null {
  if (km < 0 || kmPerLiter <= 0 || pricePerLiterCents <= 0) return null
  return Math.round((km / kmPerLiter) * pricePerLiterCents)
}

/** Custo por km (centavos, com fração) — base do comparativo etanol × gasolina. */
export function costPerKmCents(pricePerLiterCents: number, kmPerLiter: number): number | null {
  if (pricePerLiterCents <= 0 || kmPerLiter <= 0) return null
  return pricePerLiterCents / kmPerLiter
}

/** Abastecimentos em ordem cronológica. */
export function sortFuelings(fuelings: readonly Fueling[]): Fueling[] {
  return [...fuelings].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Último abastecimento (opcionalmente de um combustível). */
export function latestFueling(fuelings: readonly Fueling[], fuelType?: FuelType): Fueling | null {
  const candidates = fuelType ? fuelings.filter((fueling) => fueling.fuelType === fuelType) : fuelings
  return sortFuelings(candidates).at(-1) ?? null
}

/**
 * Consumo medido (km/l) de um combustível pelo método do tanque cheio.
 *
 * Um intervalo vai de um abastecimento com tanque cheio (e odômetro) até o próximo. Os litros do
 * intervalo são todos os colocados depois do primeiro, até o segundo (inclusive). Só entram
 * intervalos em que o tanque inicial e todos os abastecimentos foram do mesmo combustível — tanque
 * misturado fica fora. Resultado: média ponderada (km ÷ litros) dos últimos `lastIntervals`.
 */
export function measuredKmPerLiter(
  fuelings: readonly Fueling[],
  fuelType: FuelType,
  lastIntervals = MEASURED_INTERVALS,
): number | null {
  const ordered = sortFuelings(fuelings)
  const intervals: { km: number; liters: number }[] = []
  let start: { index: number; odometerKm: number; fuelType: FuelType } | null = null

  for (const [index, fueling] of ordered.entries()) {
    if (!fueling.fullTank || fueling.odometerKm === null) continue

    if (start) {
      const inInterval = ordered.slice(start.index + 1, index + 1)
      const sameFuel = start.fuelType === fuelType && inInterval.every((item) => item.fuelType === fuelType)
      const km = fueling.odometerKm - start.odometerKm
      const liters = inInterval.reduce((total, item) => total + item.liters, 0)
      if (sameFuel && km > 0 && liters > 0) intervals.push({ km, liters })
    }

    start = { index, odometerKm: fueling.odometerKm, fuelType: fueling.fuelType }
  }

  const recent = intervals.slice(-lastIntervals)
  if (recent.length === 0) return null

  const km = recent.reduce((total, interval) => total + interval.km, 0)
  const liters = recent.reduce((total, interval) => total + interval.liters, 0)
  return km / liters
}
