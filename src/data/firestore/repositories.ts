/**
 * Repositórios Firestore — tudo em users/{uid}/... (ver docs/firebase/README.md).
 *
 * Escritas NÃO esperam o servidor: com o cache offline a escrita vale na hora no aparelho e
 * sincroniza quando a internet voltar (esperar o `await` travaria a tela sem sinal). Se o servidor
 * recusar (ex.: regras), o erro vai para o console e o cache desfaz a escrita.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import { DEFAULT_SETTINGS } from '@/domain/defaults'
import type { Earning, Expense, Fueling, Motorcycle, Platform, Shift } from '@/domain/entities'
import type { DayRange } from '@/domain/period'
import type { Repositories } from '@/domain/ports'

import { numberOr, toEntity, withoutId } from './mappers'

type CollectionName = 'shifts' | 'earnings' | 'expenses' | 'fuelings' | 'platforms' | 'motorcycles'

function byCreatedAt(a: { createdAt: string }, b: { createdAt: string }): number {
  return a.createdAt.localeCompare(b.createdAt)
}

export function createFirestoreRepos(db: Firestore, uid: string): Repositories {
  const userRef = doc(db, 'users', uid)
  const col = (name: CollectionName) => collection(userRef, name)

  function write(task: Promise<void>): void {
    task.catch((error) => console.error('[firestore] escrita recusada pelo servidor', error))
  }

  function add<T extends { id: string }>(name: CollectionName, input: Omit<T, 'id'>): T {
    const ref = doc(col(name))
    write(setDoc(ref, input as DocumentData))
    return toEntity<T>(ref.id, input)
  }

  function put<T extends { id: string }>(name: CollectionName, entity: T): void {
    write(setDoc(doc(col(name), entity.id), withoutId(entity) as DocumentData))
  }

  function remove(name: CollectionName, id: string): void {
    write(deleteDoc(doc(col(name), id)))
  }

  async function listByDayRange<T extends { id: string }>(name: CollectionName, range: DayRange): Promise<T[]> {
    const snapshot = await getDocs(query(col(name), where('day', '>=', range.from), where('day', '<=', range.to)))
    return snapshot.docs.map((item) => toEntity<T>(item.id, item.data()))
  }

  async function getMotorcycle(id: string): Promise<Motorcycle | null> {
    const snapshot = await getDoc(doc(col('motorcycles'), id))
    return snapshot.exists() ? toEntity<Motorcycle>(snapshot.id, snapshot.data()) : null
  }

  return {
    shifts: {
      async findOpen() {
        const snapshot = await getDocs(query(col('shifts'), where('endedAt', '==', null), limit(1)))
        const first = snapshot.docs[0]
        return first ? toEntity<Shift>(first.id, first.data()) : null
      },
      async findLastClosed() {
        const snapshot = await getDocs(
          query(col('shifts'), where('endedAt', '!=', null), orderBy('endedAt', 'desc'), limit(1)),
        )
        const first = snapshot.docs[0]
        return first ? toEntity<Shift>(first.id, first.data()) : null
      },
      async listByDayRange(range) {
        const list = await listByDayRange<Shift>('shifts', range)
        return list.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      },
      async add(input) {
        return add<Shift>('shifts', input)
      },
      async update(shift) {
        put('shifts', shift)
      },
    },

    earnings: {
      async listByDayRange(range) {
        return (await listByDayRange<Earning>('earnings', range)).sort(byCreatedAt)
      },
      async add(input) {
        return add<Earning>('earnings', input)
      },
      async remove(id) {
        remove('earnings', id)
      },
    },

    expenses: {
      async listByDayRange(range) {
        return (await listByDayRange<Expense>('expenses', range)).sort(byCreatedAt)
      },
      async add(input) {
        return add<Expense>('expenses', input)
      },
      async remove(id) {
        remove('expenses', id)
      },
    },

    fuelings: {
      async listByDayRange(range) {
        return (await listByDayRange<Fueling>('fuelings', range)).sort(byCreatedAt)
      },
      async listByMotorcycle(motorcycleId) {
        const snapshot = await getDocs(query(col('fuelings'), where('motorcycleId', '==', motorcycleId)))
        return snapshot.docs.map((item) => toEntity<Fueling>(item.id, item.data())).sort(byCreatedAt)
      },
      async add(input) {
        return add<Fueling>('fuelings', input)
      },
      async remove(id) {
        remove('fuelings', id)
      },
    },

    platforms: {
      async list() {
        const snapshot = await getDocs(col('platforms'))
        return snapshot.docs.map((item) => toEntity<Platform>(item.id, item.data())).sort((a, b) => a.order - b.order)
      },
      async add(input) {
        return add<Platform>('platforms', input)
      },
      async update(platform) {
        put('platforms', platform)
      },
    },

    motorcycles: {
      async getActive() {
        const profile = await getDoc(userRef)
        const activeId: unknown = profile.get('activeMotorcycleId')
        return typeof activeId === 'string' ? getMotorcycle(activeId) : null
      },
      get: getMotorcycle,
      async list() {
        const snapshot = await getDocs(col('motorcycles'))
        return snapshot.docs
          .map((item) => toEntity<Motorcycle>(item.id, item.data()))
          .sort((a, b) => a.activeFrom.localeCompare(b.activeFrom))
      },
      async add(input) {
        return add<Motorcycle>('motorcycles', input)
      },
      async update(motorcycle) {
        put('motorcycles', motorcycle)
      },
      async setActive(id) {
        write(setDoc(userRef, { activeMotorcycleId: id }, { merge: true }))
      },
    },

    settings: {
      async get() {
        const data = (await getDoc(userRef)).data() ?? {}
        return {
          defaultGasolinePriceCents: numberOr(data.defaultGasolinePriceCents, DEFAULT_SETTINGS.defaultGasolinePriceCents),
          defaultEthanolPriceCents: numberOr(data.defaultEthanolPriceCents, DEFAULT_SETTINGS.defaultEthanolPriceCents),
          maintenanceReservePer100KmCents: numberOr(
            data.maintenanceReservePer100KmCents,
            DEFAULT_SETTINGS.maintenanceReservePer100KmCents,
          ),
        }
      },
      async save(values) {
        write(setDoc(userRef, { ...values }, { merge: true }))
      },
    },
  }
}
