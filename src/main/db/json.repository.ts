import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import type {
  IProjectRepository,
  ProjectRow,
  ProjectVersionRow,
  CreateProjectData,
  UpdateProjectData,
  CreateVersionData,
} from './repository'
import type { DocumentStatus } from 'shared/document-model/types'
import type { TemplateRow, ClauseRow } from './repository'


export class JsonRepository implements IProjectRepository {
  private dir: string
  private projectsDir: string
  private versionsDir: string
  private templatesDir: string
  private clausesDir: string

  constructor(storageDir: string) {
    this.dir = storageDir
    this.projectsDir = join(storageDir, 'projects')
    this.versionsDir = join(storageDir, 'versions')
    this.templatesDir = join(storageDir, 'templates')
    this.clausesDir = join(storageDir, 'clauses')
    mkdirSync(this.projectsDir, { recursive: true })
    mkdirSync(this.versionsDir, { recursive: true })
    mkdirSync(this.templatesDir, { recursive: true })
    mkdirSync(this.clausesDir, { recursive: true })
  }

  private atomicWrite(path: string, data: unknown): void {
    const tmp = path + '.tmp'
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    // On non-Windows, rename is atomic. On Windows, we overwrite directly.
    try {
      const { renameSync } = require('fs')
      renameSync(tmp, path)
    } catch {
      writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
    }
  }

  private readJSON<T>(path: string): T | null {
    if (!existsSync(path)) return null
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as T
    } catch {
      return null
    }
  }

  createProject(data: CreateProjectData): ProjectRow {
    const row: ProjectRow = {
      id: data.id,
      title: data.title,
      author: data.author,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      archivedAt: null,
      content: data.content,
    }
    this.atomicWrite(join(this.projectsDir, `${data.id}.json`), row)
    return row
  }

  listProjects(opts?: { includeArchived?: boolean; search?: string }): ProjectRow[] {
    const files = readdirSync(this.projectsDir).filter((f) => f.endsWith('.json'))
    const rows: ProjectRow[] = []
    for (const file of files) {
      const row = this.readJSON<ProjectRow>(join(this.projectsDir, file))
      if (!row) continue
      if (!opts?.includeArchived && row.status === 'archived') continue
      if (opts?.search) {
        const term = opts.search.toLowerCase()
        if (!row.title.toLowerCase().includes(term) && !row.author.toLowerCase().includes(term)) continue
      }
      rows.push(row)
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getProject(id: string): ProjectRow | null {
    return this.readJSON<ProjectRow>(join(this.projectsDir, `${id}.json`))
  }

  updateProject(data: UpdateProjectData): ProjectRow | null {
    const existing = this.getProject(data.id)
    if (!existing) return null
    const updated: ProjectRow = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.status !== undefined && { status: data.status as DocumentStatus }),
      ...(data.content !== undefined && { content: data.content }),
      updatedAt: data.updatedAt,
    }
    this.atomicWrite(join(this.projectsDir, `${data.id}.json`), updated)
    return updated
  }

  archiveProject(id: string, archivedAt: string): void {
    this.updateProject({ id, status: 'archived', updatedAt: archivedAt })
    const existing = this.getProject(id)
    if (existing) {
      this.atomicWrite(join(this.projectsDir, `${id}.json`), { ...existing, archivedAt })
    }
  }

  deleteProject(id: string): void {
    const path = join(this.projectsDir, `${id}.json`)
    if (existsSync(path)) unlinkSync(path)
  }

  saveVersion(data: CreateVersionData): ProjectVersionRow {
    const dir = join(this.versionsDir, data.projectId)
    mkdirSync(dir, { recursive: true })
    const row: ProjectVersionRow = {
      id: data.id,
      projectId: data.projectId,
      versionNum: data.versionNum,
      content: data.content,
      createdAt: data.createdAt,
      label: data.label ?? null,
    }
    this.atomicWrite(join(dir, `${data.id}.json`), row)
    return row
  }

  listVersions(projectId: string): ProjectVersionRow[] {
    const dir = join(this.versionsDir, projectId)
    if (!existsSync(dir)) return []
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    const rows: ProjectVersionRow[] = []
    for (const file of files) {
      const row = this.readJSON<ProjectVersionRow>(join(dir, file))
      if (row) rows.push(row)
    }
    return rows.sort((a, b) => b.versionNum - a.versionNum)
  }

  getVersion(versionId: string): ProjectVersionRow | null {
    // Search across all project dirs
    const projectDirs = readdirSync(this.versionsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    for (const pid of projectDirs) {
      const row = this.readJSON<ProjectVersionRow>(
        join(this.versionsDir, pid, `${versionId}.json`),
      )
      if (row) return row
    }
    return null
  }

  getNextVersionNum(projectId: string): number {
    const versions = this.listVersions(projectId)
    if (versions.length === 0) return 1
    return Math.max(...versions.map((v) => v.versionNum)) + 1
  }

  // ---- Templates ----

  createTemplate(row: TemplateRow): TemplateRow {
    this.atomicWrite(join(this.templatesDir, `${row.id}.json`), row)
    return row
  }

  listTemplates(): TemplateRow[] {
    const files = readdirSync(this.templatesDir).filter((f) => f.endsWith('.json'))
    const rows: TemplateRow[] = []
    for (const file of files) {
      const row = this.readJSON<TemplateRow>(join(this.templatesDir, file))
      if (row) rows.push(row)
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getTemplate(id: string): TemplateRow | null {
    return this.readJSON<TemplateRow>(join(this.templatesDir, `${id}.json`))
  }

  deleteTemplate(id: string): void {
    const path = join(this.templatesDir, `${id}.json`)
    if (existsSync(path)) unlinkSync(path)
  }

  // ---- Clauses ----

  createClause(row: ClauseRow): ClauseRow {
    this.atomicWrite(join(this.clausesDir, `${row.id}.json`), row)
    return row
  }

  listClauses(opts?: { category?: string; search?: string }): ClauseRow[] {
    const files = readdirSync(this.clausesDir).filter((f) => f.endsWith('.json'))
    const rows: ClauseRow[] = []
    for (const file of files) {
      const row = this.readJSON<ClauseRow>(join(this.clausesDir, file))
      if (!row) continue
      if (opts?.category && row.category !== opts.category) continue
      if (opts?.search) {
        const term = opts.search.toLowerCase()
        const hay = [row.name, row.description, row.category, ...(row.tags ?? [])].join(' ').toLowerCase()
        if (!hay.includes(term)) continue
      }
      rows.push(row)
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getClause(id: string): ClauseRow | null {
    return this.readJSON<ClauseRow>(join(this.clausesDir, `${id}.json`))
  }

  deleteClause(id: string): void {
    const path = join(this.clausesDir, `${id}.json`)
    if (existsSync(path)) unlinkSync(path)
  }

  getSetting(key: string): string | null {
    const settings = this.readJSON<Record<string, string>>(join(this.dir, 'settings.json')) ?? {}
    return settings[key] ?? null
  }

  setSetting(key: string, value: string): void {
    const path = join(this.dir, 'settings.json')
    const settings = this.readJSON<Record<string, string>>(path) ?? {}
    settings[key] = value
    this.atomicWrite(path, settings)
  }
}
