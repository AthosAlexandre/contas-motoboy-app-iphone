/**
 * Cálculos de combustível — ver docs/REGRAS-DE-NEGOCIO.md (Abastecimento, Custo de combustível,
 * Etanol ou gasolina?).
 *
 * Preço por litro e custo por km são TAXAS em centavos e podem ter fração (R$ 6,199/l = 619.9);
 * só valores em dinheiro (totais) são centavos inteiros.
 */

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
