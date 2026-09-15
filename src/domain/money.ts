/**
 * Dinheiro em centavos inteiros (ADR-0007).
 *
 * Todo valor em dinheiro que entra no app (digitado ou lido pela IA) passa por `parseMoney`.
 */

const PT_BR_MONEY = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/ // 145 · 145,9 · 1.234,56
const DOT_DECIMAL_MONEY = /^(\d+)\.(\d{1,2})$/ // 145.90 (quando a IA devolve com ponto)

/**
 * Converte um texto de dinheiro em centavos inteiros.
 * Aceita "R$ 145,90", "1.234,56", "145" e "145.90". Retorna `null` se não for um valor válido.
 * "1.234" (três dígitos após o ponto) é milhar, não decimal.
 */
export function parseMoney(input: string): number | null {
  const text = input.replace(/R\$/i, '').replace(/[\s ]/g, '')
  const match = PT_BR_MONEY.exec(text) ?? DOT_DECIMAL_MONEY.exec(text)
  if (!match) return null

  const reais = Number((match[1] ?? '').replaceAll('.', ''))
  const cents = Number((match[2] ?? '').padEnd(2, '0'))
  return reais * 100 + cents
}
