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
  | 'invalid-motorcycle'
  | 'invalid-year'
  | 'invalid-consumption'
  | 'invalid-tank'
  | 'invalid-price'
  | 'invalid-reserve'
  | 'invalid-platform-name'
  | 'duplicate-platform'
  | 'invalid-name'
  | 'invalid-email'
  | 'invalid-password'
  | 'auth-invalid-credentials'
  | 'auth-email-in-use'
  | 'auth-too-many-requests'
  | 'auth-network'
  | 'auth-cancelled'
  | 'auth-popup-blocked'
  | 'auth-account-exists'
  | 'auth-unauthorized-domain'
  | 'auth-provider-disabled'
  | 'auth-unknown'

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
  'invalid-motorcycle': 'Informe a marca e o modelo da moto.',
  'invalid-year': 'Ano da moto inválido.',
  'invalid-consumption': 'O consumo deve ficar entre 1 e 150 km/l.',
  'invalid-tank': 'Capacidade do tanque inválida.',
  'invalid-price': 'Informe um preço por litro maior que zero.',
  'invalid-reserve': 'A reserva de manutenção não pode ser negativa.',
  'invalid-platform-name': 'Informe o nome da plataforma (até 30 letras).',
  'duplicate-platform': 'Essa plataforma já existe.',
  'invalid-name': 'Informe seu nome.',
  'invalid-email': 'Informe um e-mail válido.',
  'invalid-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth-invalid-credentials': 'E-mail ou senha incorretos.',
  'auth-email-in-use': 'Já existe uma conta com este e-mail.',
  'auth-too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  'auth-network': 'Sem conexão. Verifique a internet e tente de novo.',
  'auth-cancelled': 'Login com Google cancelado.',
  'auth-popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  'auth-account-exists': 'Este e-mail já tem conta com outro jeito de entrar. Use e-mail e senha.',
  'auth-unauthorized-domain': 'Este endereço não está autorizado no Firebase (Authentication → Domínios autorizados).',
  'auth-provider-disabled': 'Esse jeito de entrar não está ativado no Firebase.',
  'auth-unknown': 'Não foi possível concluir agora. Tente de novo.',
}

export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode) {
    super(MESSAGES[code])
    this.name = 'DomainError'
    this.code = code
  }
}
