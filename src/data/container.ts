/**
 * Container de dados: o ÚNICO lugar que decide qual implementação dos repositórios o app usa.
 *
 * - `memory` (padrão): dados locais, salvos no próprio aparelho (localStorage).
 * - `firestore`: Firebase — entra na Sprint 2; até lá cai no modo local com um aviso.
 */
import type { Repositories } from '@/domain/ports'

import { createMemoryRepos } from './memory/repositories'
import type { KeyValueStorage } from './memory/collection'

function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function createRepos(): Repositories {
  if (import.meta.env.VITE_DATA_SOURCE === 'firestore') {
    console.warn('[data] Firestore entra na Sprint 2 — usando dados locais por enquanto.')
  }
  return createMemoryRepos(browserStorage())
}

export let repos: Repositories = createRepos()

/** Troca os repositórios (testes com memória limpa). */
export function setRepos(next: Repositories): void {
  repos = next
}
