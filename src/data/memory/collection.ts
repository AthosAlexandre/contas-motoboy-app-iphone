/**
 * Coleção em memória, opcionalmente salva num storage chave/valor (localStorage no navegador).
 * Sem storage (testes), vive só em memória.
 */
import { DomainError } from '@/domain/errors'

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

let sequence = 0

/** Id único sem depender de `crypto.randomUUID` (indisponível em http://IP da rede local). */
export function newId(): string {
  sequence += 1
  return `${Date.now().toString(36)}${sequence.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export class MemoryCollection<T extends { id: string }> {
  private items: T[]

  constructor(
    private readonly key: string,
    private readonly storage: KeyValueStorage | undefined,
    seed: T[] = [],
  ) {
    this.items = this.load() ?? seed
  }

  all(): T[] {
    return [...this.items]
  }

  find(id: string): T | null {
    return this.items.find((item) => item.id === id) ?? null
  }

  add(input: Omit<T, 'id'>): T {
    const item = { ...input, id: newId() } as T
    this.items.push(item)
    this.persist()
    return item
  }

  update(item: T): void {
    const index = this.items.findIndex((current) => current.id === item.id)
    if (index === -1) throw new DomainError('not-found')
    this.items[index] = item
    this.persist()
  }

  remove(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
    this.persist()
  }

  private load(): T[] | null {
    try {
      const raw = this.storage?.getItem(this.key)
      return raw ? (JSON.parse(raw) as T[]) : null
    } catch {
      return null
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.items))
    } catch {
      // Storage cheio ou bloqueado: segue só em memória.
    }
  }
}
