/**
 * Casos de uso de conta: entrar, criar conta, recuperar senha e sair.
 * Cada ação só termina quando a sessão (e os repositórios do usuário) já trocaram.
 */
import { auth, dataSource, getSession, onSessionChange, waitForSession, type DataSource } from '@/data/container'
import type { AuthUser } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { assertPassword, normalizeEmail } from '@/domain/validation'

export function currentUser(): AuthUser | null {
  return getSession()
}

export function watchSession(listener: (user: AuthUser | null) => void): () => void {
  return onSessionChange(listener)
}

export function currentDataSource(): DataSource {
  return dataSource()
}

export async function signIn(email: string, password: string): Promise<void> {
  const cleanEmail = normalizeEmail(email)
  if (!password) throw new DomainError('invalid-password')
  await auth.signIn(cleanEmail, password)
  await waitForSession((user) => user !== null)
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  const cleanName = name.trim()
  if (!cleanName) throw new DomainError('invalid-name')
  const cleanEmail = normalizeEmail(email)
  assertPassword(password)
  await auth.signUp(cleanName, cleanEmail, password)
  await waitForSession((user) => user !== null)
}

/**
 * Entrar (ou criar conta) com Google. Em produção a página sai para o Google e volta já logada; no
 * localhost abre um popup e continua daqui.
 */
export async function signInWithGoogle(): Promise<void> {
  await auth.signInWithGoogle()
  await waitForSession((user) => user !== null)
}

/** Erro da volta do Google (para mostrar na tela de entrar depois do redirecionamento). */
export async function googleRedirectError(): Promise<string | null> {
  const error = await auth.redirectError()
  return error && error.code !== 'auth-cancelled' ? error.message : null
}

export async function sendPasswordReset(email: string): Promise<void> {
  await auth.sendPasswordReset(normalizeEmail(email))
}

export async function signOut(): Promise<void> {
  await auth.signOut()
  await waitForSession((user) => user === null)
}
