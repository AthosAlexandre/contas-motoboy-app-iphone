/**
 * Login fake do modo local (sem Firebase): começa já logado como "Modo local".
 */
import type { AuthUser } from '@/domain/entities'
import type { AuthService } from '@/domain/ports'

export const LOCAL_USER: AuthUser = { uid: 'local', name: 'Modo local', email: '' }

export function createMemoryAuth(initialUser: AuthUser | null = LOCAL_USER): AuthService {
  let user = initialUser
  const listeners = new Set<(user: AuthUser | null) => void>()

  function emit() {
    for (const listener of listeners) listener(user)
  }

  return {
    onChange(listener) {
      listeners.add(listener)
      listener(user)
      return () => {
        listeners.delete(listener)
      }
    },
    async signIn(email) {
      user = { uid: 'local', name: LOCAL_USER.name, email }
      emit()
    },
    async signUp(name, email) {
      user = { uid: 'local', name, email }
      emit()
    },
    async signInWithGoogle() {
      user = { uid: 'local', name: 'Conta Google (modo local)', email: '' }
      emit()
    },
    async redirectError() {
      return null
    },
    async sendPasswordReset() {
      // Modo local: não há e-mail para enviar.
    },
    async signOut() {
      user = null
      emit()
    },
  }
}
