/**
 * Primeiro acesso: cria users/{uid} com os Ajustes padrão e as plataformas iniciais.
 * Idempotente — pode rodar a cada login.
 */
import { doc, getDoc, setDoc, writeBatch, type Firestore } from 'firebase/firestore'

import { DEFAULT_PLATFORMS, DEFAULT_SETTINGS } from '@/domain/defaults'
import type { AuthUser } from '@/domain/entities'

import { withoutId } from './mappers'

export async function ensureUserData(db: Firestore, user: AuthUser): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    // Cadastro: o primeiro login pode chegar antes do nome ser gravado no Auth.
    if (!snapshot.get('name') && user.name) await setDoc(userRef, { name: user.name }, { merge: true })
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
  await batch.commit()
}
