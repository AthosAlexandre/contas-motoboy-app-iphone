/**
 * Casos de uso dos Ajustes: preços padrão, reserva de manutenção e plataformas.
 */
import { repos } from '@/data/container'
import type { Platform, Settings } from '@/domain/entities'
import { DomainError } from '@/domain/errors'
import { normalizePlatformName, validateSettings } from '@/domain/validation'

export async function getSettings(): Promise<Settings> {
  return repos.settings.get()
}

export async function saveSettings(settings: Settings): Promise<void> {
  await repos.settings.save(validateSettings(settings))
}

/** Todas as plataformas (ativas e desativadas). */
export async function listAllPlatforms(): Promise<Platform[]> {
  return repos.platforms.list()
}

export async function addPlatform(name: string): Promise<Platform> {
  const cleanName = normalizePlatformName(name)
  const platforms = await repos.platforms.list()

  if (platforms.some((platform) => platform.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'))) {
    throw new DomainError('duplicate-platform')
  }

  const order = Math.max(0, ...platforms.map((platform) => platform.order)) + 1
  return repos.platforms.add({ name: cleanName, isActive: true, order })
}

/** Desativar esconde a plataforma no lançamento, mas mantém o histórico. */
export async function setPlatformActive(platform: Platform, isActive: boolean): Promise<void> {
  await repos.platforms.update({ ...platform, isActive })
}
