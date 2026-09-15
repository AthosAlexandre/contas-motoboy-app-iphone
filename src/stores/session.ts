/**
 * Sessão: usuário logado e moto ativa (as guardas de rota dependem dos dois).
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  currentDataSource,
  currentUser,
  signIn as signInAction,
  signInWithGoogle as signInWithGoogleAction,
  signOut as signOutAction,
  signUp as signUpAction,
  watchSession,
} from '@/actions/auth'
import { getActiveMotorcycle } from '@/actions/reference'
import type { AuthUser, Motorcycle } from '@/domain/entities'

export const useSessionStore = defineStore('session', () => {
  const user = ref<AuthUser | null>(currentUser())
  const motorcycle = ref<Motorcycle | null>(null)
  const isLoggedIn = computed(() => user.value !== null)
  /** Sem Firebase: dados só neste aparelho. */
  const isLocalMode = currentDataSource() === 'memory'

  let motorcycleRequest: Promise<void> | null = null

  watchSession((next) => {
    user.value = next
    motorcycle.value = null
    motorcycleRequest = null
  })

  /** Carrega a moto ativa uma vez por sessão (`force` para recarregar depois de salvar). */
  function loadMotorcycle(force = false): Promise<void> {
    if (!user.value) return Promise.resolve()
    if (!motorcycleRequest || force) {
      motorcycleRequest = getActiveMotorcycle()
        .then((active) => {
          motorcycle.value = active
        })
        .catch((error) => {
          console.error('[session] não foi possível carregar a moto', error)
          motorcycleRequest = null
        })
    }
    return motorcycleRequest
  }

  async function signIn(email: string, password: string) {
    await signInAction(email, password)
  }

  async function signUp(name: string, email: string, password: string) {
    await signUpAction(name, email, password)
  }

  async function signInWithGoogle() {
    await signInWithGoogleAction()
  }

  async function signOut() {
    await signOutAction()
  }

  return { user, motorcycle, isLoggedIn, isLocalMode, loadMotorcycle, signIn, signUp, signInWithGoogle, signOut }
})
