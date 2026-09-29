import type Database from 'better-sqlite3'
import type {
  IProjectRepository,
  ProjectRow,
  ProjectVersionRow,
  CreateProjectData,
  UpdateProjectData,
  CreateVersionData,
} from './repository'
import type { DocumentStatus } from 'shared/document-model/types'

interface RawProjectRow {
  id: string
  title: string
  author: string
  status: string
  created_at: string
  updated_at: string
  archived_at: string | null
  content: string
}

interface RawVersionRow {
  id: string
  project_id: string
  version_num: number
  content: string
  created_at: string
  label: string | null
}

interface RawSettingRow {
  key: string
  value: string
}

function parseProject(row: RawProjectRow): ProjectRow {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status as DocumentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    content: JSON.parse(row.content),
  }
}

function parseVersion(row: RawVersionRow): ProjectVersionRow {
  return {
    id: row.id,
    projectId: row.project_id,
    versionNum: row.version_num,
    content: JSON.parse(row.content),
    createdAt: row.created_at,
    label: row.label,
  }
}

export class SqliteRepository implements IProjectRepository {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  createProject(data: CreateProjectData): ProjectRow {
    this.db
      .prepare(
        `INSERT INTO projects (id, title, author, status, created_at, updated_at, content)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.id,
        data.title,
        data.author,
        data.status,
        data.createdAt,
        data.updatedAt,
        JSON.stringify(data.content),
      )
    return this.getProject(data.id)!
  }

  listProjects(opts?: { includeArchived?: boolean; search?: string }): ProjectRow[] {
    const conditions: string[] = ['deleted_at IS NULL']
    const params: unknown[] = []

    if (!opts?.includeArchived) {
      conditions.push(`status != 'archived'`)
    }
    if (opts?.search) {
      conditions.push('(title LIKE ? OR author LIKE ?)')
      const term = `%${opts.search}%`
      params.push(term, term)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const sql = `SELECT * FROM projects ${where} ORDER BY updated_at DESC`
    const rows = this.db.prepare(sql).all(...params) as RawProjectRow[]
    return rows.map(parseProject)
  }

  getProject(id: string): ProjectRow | null {
    const row = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as RawProjectRow | undefined
    return row ? parseProject(row) : null
  }

  updateProject(data: UpdateProjectData): ProjectRow | null {
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [data.updatedAt]

    if (data.title !== undefined) { sets.push('title = ?'); params.push(data.title) }
    if (data.author !== undefined) { sets.push('author = ?'); params.push(data.author) }
    if (data.status !== undefined) { sets.push('status = ?'); params.push(data.status) }
    if (data.content !== undefined) { sets.push('content = ?'); params.push(JSON.stringify(data.content)) }

    params.push(data.id)
    this.db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...params)
    return this.getProject(data.id)
  }

  archiveProject(id: string, archivedAt: string): void {
    this.db
      .prepare(`UPDATE projects SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?`)
      .run(archivedAt, archivedAt, id)
  }

  deleteProject(id: string): void {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  }

  saveVersion(data: CreateVersionData): ProjectVersionRow {
    this.db
      .prepare(
        `INSERT INTO project_versions (id, project_id, version_num, content, created_at, label)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(data.id, data.projectId, data.versionNum, JSON.stringify(data.content), data.createdAt, data.label ?? null)
    return this.getVersion(data.id)!
  }

  listVersions(projectId: string): ProjectVersionRow[] {
    const rows = this.db
      .prepare('SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_num DESC')
      .all(projectId) as RawVersionRow[]
    return rows.map(parseVersion)
  }

  getVersion(versionId: string): ProjectVersionRow | null {
    const row = this.db
      .prepare('SELECT * FROM project_versions WHERE id = ?')
      .get(versionId) as RawVersionRow | undefined
    return row ? parseVersion(row) : null
  }

  getNextVersionNum(projectId: string): number {
    const result = this.db
      .prepare('SELECT COALESCE(MAX(version_num), 0) + 1 as next FROM project_versions WHERE project_id = ?')
      .get(projectId) as { next: number }
    return result.next
  }

  getSetting(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get(key) as RawSettingRow | undefined
    return row?.value ?? null
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run(key, value)
  }
}
