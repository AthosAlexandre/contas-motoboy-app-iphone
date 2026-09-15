/**
 * Login com Firebase Auth: e-mail e senha (ADR-0004) e Google (ADR-0016).
 * Erros do Firebase viram DomainError com mensagem em português.
 */
import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'

import type { AuthUser } from '@/domain/entities'
import { DomainError, type DomainErrorCode } from '@/domain/errors'
import type { AuthService } from '@/domain/ports'

const ERROR_CODES: Record<string, DomainErrorCode> = {
  'auth/invalid-credential': 'auth-invalid-credentials',
  'auth/invalid-login-credentials': 'auth-invalid-credentials',
  'auth/wrong-password': 'auth-invalid-credentials',
  'auth/user-not-found': 'auth-invalid-credentials',
  'auth/invalid-email': 'invalid-email',
  'auth/email-already-in-use': 'auth-email-in-use',
  'auth/weak-password': 'invalid-password',
  'auth/too-many-requests': 'auth-too-many-requests',
  'auth/network-request-failed': 'auth-network',
  'auth/popup-closed-by-user': 'auth-cancelled',
  'auth/cancelled-popup-request': 'auth-cancelled',
  'auth/user-cancelled': 'auth-cancelled',
  'auth/popup-blocked': 'auth-popup-blocked',
  'auth/account-exists-with-different-credential': 'auth-account-exists',
  'auth/unauthorized-domain': 'auth-unauthorized-domain',
  'auth/operation-not-allowed': 'auth-provider-disabled',
}

function toDomainError(error: unknown): DomainError {
  if (error instanceof DomainError) return error
  const code = error instanceof FirebaseError ? ERROR_CODES[error.code] : undefined
  return new DomainError(code ?? 'auth-unknown')
}

async function guard(task: () => Promise<unknown>): Promise<void> {
  try {
    await task()
  } catch (error) {
    console.error('[auth]', error)
    throw toDomainError(error)
  }
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, name: user.displayName ?? '', email: user.email ?? '' }
}

/**
 * Redirecionamento só quando o `authDomain` é o próprio site (produção, com `/__/auth` repassado ao
 * Firebase pela Vercel — ADR-0016). Fora disso (localhost) usa popup: o redirecionamento entre domínios
 * diferentes é bloqueado pelo Safari, e o popup não volta no app instalado no iPhone.
 */
function shouldRedirect(auth: Auth): boolean {
  return typeof window !== 'undefined' && auth.config.authDomain === window.location.host
}

export function createFirebaseAuth(auth: Auth): AuthService {
  const listeners = new Set<(user: AuthUser | null) => void>()
  let known = false
  let current: AuthUser | null = null

  function emit(user: User | null) {
    known = true
    current = user ? toAuthUser(user) : null
    for (const listener of listeners) listener(current)
  }

  onAuthStateChanged(auth, emit)

  // Volta do Google (redirecionamento): o usuário chega pelo onAuthStateChanged; aqui só guardamos o erro.
  const redirectResult = getRedirectResult(auth).then(
    () => null,
    (error: unknown) => {
      console.error('[auth] retorno do login com Google', error)
      return toDomainError(error)
    },
  )

  return {
    onChange(listener) {
      listeners.add(listener)
      if (known) listener(current)
      return () => {
        listeners.delete(listener)
      }
    },

    signIn: (email, password) => guard(() => signInWithEmailAndPassword(auth, email, password)),

    signUp: (name, email, password) =>
      guard(async () => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: name })
        // O onAuthStateChanged já disparou antes do nome existir: avisa de novo, agora com o nome.
        emit(credential.user)
      }),

    signInWithGoogle: () =>
      guard(async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        if (shouldRedirect(auth)) await signInWithRedirect(auth, provider)
        else await signInWithPopup(auth, provider)
      }),

    redirectError: () => redirectResult,

    sendPasswordReset: (email) => guard(() => sendPasswordResetEmail(auth, email)),

    signOut: () => guard(() => signOut(auth)),
  }
}
