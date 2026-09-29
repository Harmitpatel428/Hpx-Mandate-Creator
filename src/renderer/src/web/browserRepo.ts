import type { ProjectRecord, ProjectVersionRecord } from 'shared/ipc/types'
import type { TemplateRecord, ClauseRecord } from 'shared/document-model/library'
import type { MandateDocument, DocumentStatus } from 'shared/document-model/types'

// Row/data shapes mirror the main-process repository (kept local so the
// renderer never imports from src/main).
type ProjectRow = ProjectRecord
type ProjectVersionRow = ProjectVersionRecord
type TemplateRow = TemplateRecord
type ClauseRow = ClauseRecord

interface CreateProjectData {
  id: string; title: string; author: string; status: DocumentStatus
  createdAt: string; updatedAt: string; content: MandateDocument
}
interface UpdateProjectData {
  id: string; title?: string; author?: string; status?: DocumentStatus
  content?: MandateDocument; updatedAt: string
}
interface CreateVersionData {
  id: string; projectId: string; versionNum: number
  content: MandateDocument; createdAt: string; label?: string
}

const NS = 'mmc'
const K = {
  projects: `${NS}:projects`,
  versions: `${NS}:versions`,
  templates: `${NS}:templates`,
  clauses: `${NS}:clauses`,
  settings: `${NS}:settings`,
}

function read<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, T>) : {}
  } catch {
    return {}
  }
}

function write<T>(key: string, value: Record<string, T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('[web] localStorage write failed:', e)
  }
}

/**
 * A browser (localStorage) implementation of the project repository. Mirrors
 * JsonRepository so the same ProjectService/LibraryService logic runs in the
 * web dev build. All data lives under the `mmc:*` keys and persists across
 * reloads within the same origin.
 */
export class BrowserRepository {
  // ---- Projects ----
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
    const all = read<ProjectRow>(K.projects)
    all[row.id] = row
    write(K.projects, all)
    return row
  }

  listProjects(opts?: { includeArchived?: boolean; search?: string }): ProjectRow[] {
    const all = Object.values(read<ProjectRow>(K.projects))
    return all
      .filter((p) => (opts?.includeArchived ? true : p.status !== 'archived'))
      .filter((p) => {
        if (!opts?.search) return true
        const t = opts.search.toLowerCase()
        return p.title.toLowerCase().includes(t) || (p.author ?? '').toLowerCase().includes(t)
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getProject(id: string): ProjectRow | null {
    return read<ProjectRow>(K.projects)[id] ?? null
  }

  updateProject(data: UpdateProjectData): ProjectRow | null {
    const all = read<ProjectRow>(K.projects)
    const existing = all[data.id]
    if (!existing) return null
    const updated: ProjectRow = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.content !== undefined && { content: data.content }),
      updatedAt: data.updatedAt,
    }
    all[data.id] = updated
    write(K.projects, all)
    return updated
  }

  archiveProject(id: string, archivedAt: string): void {
    const all = read<ProjectRow>(K.projects)
    const existing = all[id]
    if (!existing) return
    all[id] = { ...existing, status: 'archived', archivedAt, updatedAt: archivedAt }
    write(K.projects, all)
  }

  deleteProject(id: string): void {
    const all = read<ProjectRow>(K.projects)
    delete all[id]
    write(K.projects, all)
  }

  // ---- Versions ----
  saveVersion(data: CreateVersionData): ProjectVersionRow {
    const row: ProjectVersionRow = {
      id: data.id,
      projectId: data.projectId,
      versionNum: data.versionNum,
      content: data.content,
      createdAt: data.createdAt,
      label: data.label ?? null,
    }
    const all = read<ProjectVersionRow>(K.versions)
    all[row.id] = row
    write(K.versions, all)
    return row
  }

  listVersions(projectId: string): ProjectVersionRow[] {
    return Object.values(read<ProjectVersionRow>(K.versions))
      .filter((v) => v.projectId === projectId)
      .sort((a, b) => b.versionNum - a.versionNum)
  }

  getVersion(versionId: string): ProjectVersionRow | null {
    return read<ProjectVersionRow>(K.versions)[versionId] ?? null
  }

  getNextVersionNum(projectId: string): number {
    const versions = this.listVersions(projectId)
    return versions.length === 0 ? 1 : Math.max(...versions.map((v) => v.versionNum)) + 1
  }

  // ---- Templates ----
  createTemplate(row: TemplateRow): TemplateRow {
    const all = read<TemplateRow>(K.templates)
    all[row.id] = row
    write(K.templates, all)
    return row
  }

  listTemplates(): TemplateRow[] {
    return Object.values(read<TemplateRow>(K.templates)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getTemplate(id: string): TemplateRow | null {
    return read<TemplateRow>(K.templates)[id] ?? null
  }

  deleteTemplate(id: string): void {
    const all = read<TemplateRow>(K.templates)
    delete all[id]
    write(K.templates, all)
  }

  // ---- Clauses ----
  createClause(row: ClauseRow): ClauseRow {
    const all = read<ClauseRow>(K.clauses)
    all[row.id] = row
    write(K.clauses, all)
    return row
  }

  listClauses(opts?: { category?: string; search?: string }): ClauseRow[] {
    return Object.values(read<ClauseRow>(K.clauses))
      .filter((c) => (opts?.category ? c.category === opts.category : true))
      .filter((c) => {
        if (!opts?.search) return true
        const t = opts.search.toLowerCase()
        return [c.name, c.description, c.category, ...(c.tags ?? [])].join(' ').toLowerCase().includes(t)
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getClause(id: string): ClauseRow | null {
    return read<ClauseRow>(K.clauses)[id] ?? null
  }

  deleteClause(id: string): void {
    const all = read<ClauseRow>(K.clauses)
    delete all[id]
    write(K.clauses, all)
  }

  // ---- Settings ----
  getSetting(key: string): string | null {
    return read<string>(K.settings)[key] ?? null
  }

  setSetting(key: string, value: string): void {
    const all = read<string>(K.settings)
    all[key] = value
    write(K.settings, all)
  }
}
