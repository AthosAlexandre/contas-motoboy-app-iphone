/**
 * Erros de regra de negócio. A mensagem já vem pronta para mostrar ao usuário.
 */

export type DomainErrorCode =
  | 'invalid-amount'
  | 'invalid-tip'
  | 'invalid-liters'
  | 'invalid-km'
  | 'km-end-before-start'
  | 'shift-already-open'
  | 'no-open-shift'
  | 'no-motorcycle'
  | 'fuel-not-supported'
  | 'not-found'

const MESSAGES: Record<DomainErrorCode, string> = {
  'invalid-amount': 'Informe um valor maior que zero.',
  'invalid-tip': 'A gorjeta não pode ser negativa.',
  'invalid-liters': 'Informe os litros colocados.',
  'invalid-km': 'Informe um km válido.',
  'km-end-before-start': 'O km final não pode ser menor que o km inicial.',
  'shift-already-open': 'Já existe um turno em andamento.',
  'no-open-shift': 'Nenhum turno em andamento.',
  'no-motorcycle': 'Cadastre a moto antes de começar.',
  'fuel-not-supported': 'Esta moto não aceita etanol.',
  'not-found': 'Registro não encontrado.',
}

export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode) {
    super(MESSAGES[code])
    this.name = 'DomainError'
    this.code = code
  }
}
