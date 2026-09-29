import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import type { IProjectRepository } from '../db/repository'
import { SqliteRepository } from '../db/sqlite.repository'
import { JsonRepository } from '../db/json.repository'
import { MIGRATIONS } from '../db/migrations.sql'

export type StorageEngine = 'sqlite' | 'json'

let _repo: IProjectRepository | null = null
let _engine: StorageEngine = 'json'

export function getRepository(): IProjectRepository {
  if (!_repo) throw new Error('Database not initialized. Call initDatabase() first.')
  return _repo
}

export function getEngine(): StorageEngine {
  return _engine
}

export function initDatabase(): { repo: IProjectRepository; engine: StorageEngine } {
  const userData = app.getPath('userData')
  mkdirSync(userData, { recursive: true })

  // Try SQLite first
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite3 = require('better-sqlite3') as typeof import('better-sqlite3')
    const dbPath = join(userData, 'master-mandate.db')
    const db = new BetterSqlite3(dbPath)

    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('synchronous = NORMAL')

    runMigrations(db)

    _repo = new SqliteRepository(db)
    _engine = 'sqlite'
    console.warn(`[DB] Using SQLite at ${dbPath}`)
  } catch (err) {
    console.warn('[DB] SQLite unavailable, falling back to JSON storage:', err)
    const storageDir = join(userData, 'storage')
    mkdirSync(storageDir, { recursive: true })
    _repo = new JsonRepository(storageDir)
    _engine = 'json'
    console.warn(`[DB] Using JSON storage at ${storageDir}`)
  }

  return { repo: _repo!, engine: _engine }
}

function runMigrations(db: import('better-sqlite3').Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const applied = db.prepare('SELECT version FROM schema_migrations').pluck().all() as number[]

  // DDL is embedded (not read from disk) so migrations run correctly in the
  // packaged app, where the .sql source files are not copied into out/.
  for (const m of MIGRATIONS) {
    if (!applied.includes(m.version)) {
      db.exec(m.sql)
      db.prepare('INSERT OR IGNORE INTO schema_migrations(version) VALUES (?)').run(m.version)
    }
  }
}
