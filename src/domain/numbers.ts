/**
 * Números decimais que NÃO são dinheiro: litros, km/l, preço por litro (taxa).
 */

const DECIMAL = /^(\d+)(?:[.,](\d+))?$/ // 8,437 · 8.437 · 40

/** Converte "8,437" ou "8.437" em número. Retorna `null` se não for um decimal válido. */
export function parseDecimal(input: string): number | null {
  const match = DECIMAL.exec(input.replace(/[\s ]/g, ''))
  if (!match) return null
  return Number(`${match[1]}.${match[2] ?? '0'}`)
}
