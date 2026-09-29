import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs'
import type { ProjectRow } from '../db/repository'

const MAX_BACKUPS = 20

/**
 * Local safety backups written before destructive operations (version
 * restore, project delete). Retains the most recent MAX_BACKUPS files and
 * prunes older ones. Works for both storage engines: a per-project JSON
 * snapshot is always written; on SQLite the database file is also copied.
 */
export class BackupService {
  private backupDir: string
  private engine: 'sqlite' | 'json'

  constructor(engine: 'sqlite' | 'json') {
    this.engine = engine
    this.backupDir = join(app.getPath('userData'), 'backups')
    mkdirSync(this.backupDir, { recursive: true })
  }

  /** Snapshot a single project's full record before a destructive change. */
  backupProject(project: ProjectRow, reason = 'auto'): void {
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const safeId = project.id.replace(/[^a-zA-Z0-9_-]/g, '')
      const file = join(this.backupDir, `project-${safeId}-${reason}-${ts}.json`)
      writeFileSync(file, JSON.stringify(project, null, 2), 'utf-8')

      if (this.engine === 'sqlite') {
        const src = join(app.getPath('userData'), 'master-mandate.db')
        if (existsSync(src)) copyFileSync(src, join(this.backupDir, `db-${reason}-${ts}.db`))
      }

      this.pruneOldBackups()
    } catch (err) {
      console.warn('[Backup] Failed to back up project:', err)
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
