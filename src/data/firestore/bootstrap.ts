/**
 * Primeiro acesso: cria users/{uid} com os Ajustes padrão e as plataformas iniciais.
 * Idempotente — pode rodar a cada login.
 *
 * Nada aqui espera o servidor (ADR-0014): a leitura tem prazo e a gravação é disparada sem `await`.
 * Assim um login com sinal ruim não trava a abertura do app nem a primeira tela.
 */
import { doc, getDoc, setDoc, writeBatch, type DocumentSnapshot, type Firestore } from 'firebase/firestore'

import { DEFAULT_PLATFORMS, DEFAULT_SETTINGS } from '@/domain/defaults'
import type { AuthUser } from '@/domain/entities'

import { withoutId } from './mappers'

/** Se o servidor não responder a tempo, seguimos em frente (o próximo login tenta de novo). */
const READ_TIMEOUT_MS = 8000

function withTimeout(promise: Promise<DocumentSnapshot>): Promise<DocumentSnapshot | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), READ_TIMEOUT_MS)),
  ])
}

export async function ensureUserData(db: Firestore, user: AuthUser): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await withTimeout(getDoc(userRef))

  if (!snapshot) {
    console.warn('[data] não deu para conferir os dados do usuário a tempo; seguindo sem bootstrap')
    return
  }

  if (snapshot.exists()) {
    // Cadastro: o primeiro login pode chegar antes do nome ser gravado no Auth.
    if (!snapshot.get('name') && user.name) {
      void setDoc(userRef, { name: user.name }, { merge: true }).catch((error: unknown) =>
        console.error('[firestore] não foi possível gravar o nome', error),
      )
    }
    return
  }

  const batch = writeBatch(db)
  batch.set(userRef, {
    name: user.name,
    email: user.email,
    activeMotorcycleId: null,
    ...DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
  })
  for (const platform of DEFAULT_PLATFORMS) {
    batch.set(doc(userRef, 'platforms', platform.id), withoutId(platform))
  }

  // Vale na hora no cache do aparelho; sobe quando a conexão permitir.
  void batch.commit().catch((error: unknown) =>
    console.error('[firestore] não foi possível criar os dados iniciais do usuário', error),
  )
}
