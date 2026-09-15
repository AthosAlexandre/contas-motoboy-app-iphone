/**
 * Mensagem de erro para mostrar ao usuário. Erros de regra de negócio (DomainError) já vêm prontos.
 */
import { DomainError } from '@/domain/errors'

export function errorMessage(error: unknown): string {
  return error instanceof DomainError ? error.message : 'Não foi possível concluir agora. Tente de novo.'
}
