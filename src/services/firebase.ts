/**
 * Inicialização do Firebase (SDK Web v12).
 *
 * As credenciais vêm do `.env` (prefixo VITE_). Elas NÃO são segredo — a segurança vem das regras do
 * Firestore (firestore.rules) e, na Sprint 5, do App Check.
 *
 * Só é carregado quando VITE_DATA_SOURCE=firestore (import dinâmico em data/container.ts).
 * Regra do projeto: só `data/` importa este arquivo.
 */
import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)

export const firebaseAuth = getAuth(firebaseApp)

// E-mails automáticos (reset de senha) em português.
firebaseAuth.languageCode = 'pt-BR'

// Mantém a sessão entre aberturas do app.
setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
  console.error('[firebase] falha ao definir a persistência do login', error)
})

// Cache offline no aparelho (IndexedDB): lançar sem sinal e sincronizar depois.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
