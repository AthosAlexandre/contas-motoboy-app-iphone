/**
 * Container de dados: o ÚNICO lugar que decide quais implementações o app usa e troca os
 * repositórios quando a sessão muda.
 *
 * - `memory` (padrão): sem Firebase; dados salvos no próprio aparelho (localStorage), já logado.
 * - `firestore`: Firebase Auth + Firestore em users/{uid}. O SDK só é baixado neste modo.
 *
 * Chame `initData()` uma vez antes de montar o app (src/main.ts).
 */
import type { AuthUser } from '@/domain/entities'
import type { AuthService, Repositories } from '@/domain/ports'

import { createMemoryAuth } from './auth/memoryAuth'
import type { KeyValueStorage } from './memory/collection'
import { createMemoryRepos } from './memory/repositories'

export type DataSource = 'memory' | 'firestore'

export let repos: Repositories = createMemoryRepos()
export let auth: AuthService = createMemoryAuth()

let session: AuthUser | null = null
const sessionListeners = new Set<(user: AuthUser | null) => void>()

export function dataSource(): DataSource {
  return import.meta.env.VITE_DATA_SOURCE === 'firestore' ? 'firestore' : 'memory'
}

export function getSession(): AuthUser | null {
  return session
}

/** Avisa a cada mudança de sessão — já com os repositórios do novo usuário no lugar. */
export function onSessionChange(listener: (user: AuthUser | null) => void): () => void {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

/** Resolve quando a sessão satisfizer a condição (ex.: logou, saiu). */
export function waitForSession(predicate: (user: AuthUser | null) => boolean): Promise<void> {
  if (predicate(session)) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = onSessionChange((user) => {
      if (predicate(user)) {
        stop()
        resolve()
      }
    })
  })
}

function publish(user: AuthUser | null): void {
  session = user
  for (const listener of sessionListeners) listener(user)
}

function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export async function initData(): Promise<void> {
  if (dataSource() === 'memory') {
    repos = createMemoryRepos(browserStorage())
    setAuth(createMemoryAuth())
    return
  }

  const [{ db, firebaseAuth }, { createFirebaseAuth }, { createFirestoreRepos }, { ensureUserData }] =
    await Promise.all([
      import('@/services/firebase'),
      import('./auth/firebaseAuth'),
      import('./firestore/repositories'),
      import('./firestore/bootstrap'),
    ])

  auth = createFirebaseAuth(firebaseAuth)

  // Mudanças de sessão em fila, para um login não atropelar o outro.
  let queue = Promise.resolve()
  await new Promise<void>((resolve) => {
    auth.onChange((user) => {
      queue = queue.then(async () => {
        if (user) {
          try {
            await ensureUserData(db, user)
          } catch (error) {
            console.error('[data] não foi possível preparar os dados do usuário (regras publicadas?)', error)
          }
          repos = createFirestoreRepos(db, user.uid)
        } else {
          repos = createMemoryRepos(undefined, { exampleMotorcycle: false })
        }
        publish(user)
        resolve()
      })
    })
  })
}

/** Troca os repositórios (testes com memória limpa). */
export function setRepos(next: Repositories): void {
  repos = next
}

/** Troca o serviço de login e acompanha a sessão dele (modo local e testes). */
export function setAuth(next: AuthService): void {
  auth = next
  next.onChange(publish)
}
