import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs'

const MAX_BACKUPS = 20

export class BackupService {
  private backupDir: string
  private engine: 'sqlite' | 'json'

  constructor(engine: 'sqlite' | 'json') {
    this.engine = engine
    this.backupDir = join(app.getPath('userData'), 'backups')
    mkdirSync(this.backupDir, { recursive: true })
  }

  createBackup(reason = 'auto'): void {
    try {
      const userData = app.getPath('userData')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')

      if (this.engine === 'sqlite') {
        const src = join(userData, 'master-mandate.db')
        if (!existsSync(src)) return
        copyFileSync(src, join(this.backupDir, `mandate-${reason}-${ts}.db`))
      }

      this.pruneOldBackups()
    } catch (err) {
      console.warn('[Backup] Failed to create backup:', err)
    }
  }

  private pruneOldBackups(): void {
    const files = readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.db') || f.endsWith('.json'))
      .map((f) => ({ name: f, mtime: statSync(join(this.backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime)

    for (const file of files.slice(MAX_BACKUPS)) {
      try {
        unlinkSync(join(this.backupDir, file.name))
      } catch {
        // Ignore prune errors
      }
    }
  }
}
