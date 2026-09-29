import type { IProjectRepository } from '../db/repository'

export class SettingsService {
  constructor(private repo: IProjectRepository) {}

  get(key: string): unknown {
    const raw = this.repo.getSetting(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  set(key: string, value: unknown): void {
    this.repo.setSetting(key, JSON.stringify(value))
  }

  getAll(): Record<string, unknown> {
    // Common settings with defaults
    const keys = [
      'defaultPageSize',
      'defaultCurrency',
      'defaultLocale',
      'autosaveIntervalMs',
      'exportFolderPath',
      'theme',
    ]
    const result: Record<string, unknown> = {}
    for (const k of keys) {
      result[k] = this.get(k)
    }
    return result
  }
}
