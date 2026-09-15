/**
 * Conversão documento ↔ entidade. No Firestore o `id` é o id do documento, não um campo.
 * Datas ficam como strings ISO / 'yyyy-MM-dd' (iguais às entidades e ordenáveis).
 */
import type { DocumentData } from 'firebase/firestore'

export function withoutId<T extends { id: string }>(entity: T): Omit<T, 'id'> {
  return Object.fromEntries(Object.entries(entity).filter(([key]) => key !== 'id')) as Omit<T, 'id'>
}

export function toEntity<T extends { id: string }>(id: string, data: DocumentData): T {
  return { ...data, id } as T
}

export function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
