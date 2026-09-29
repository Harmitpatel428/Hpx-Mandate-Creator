import type { MandateDocument, DocumentStatus } from 'shared/document-model/types'
import type { TemplateRecord, ClauseRecord } from 'shared/document-model/library'

export type TemplateRow = TemplateRecord
export type ClauseRow = ClauseRecord

export interface ProjectRow {
  id: string
  title: string
  author: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  content: MandateDocument
}

export interface ProjectVersionRow {
  id: string
  projectId: string
  versionNum: number
  content: MandateDocument
  createdAt: string
  label: string | null
}

export interface CreateProjectData {
  id: string
  title: string
  author: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  content: MandateDocument
}

export interface UpdateProjectData {
  id: string
  title?: string
  author?: string
  status?: DocumentStatus
  content?: MandateDocument
  updatedAt: string
}

export interface CreateVersionData {
  id: string
  projectId: string
  versionNum: number
  content: MandateDocument
  createdAt: string
  label?: string
}

export interface IProjectRepository {
  // Projects
  createProject(data: CreateProjectData): ProjectRow
  listProjects(opts?: { includeArchived?: boolean; search?: string }): ProjectRow[]
  getProject(id: string): ProjectRow | null
  updateProject(data: UpdateProjectData): ProjectRow | null
  archiveProject(id: string, archivedAt: string): void
  deleteProject(id: string): void

  // Versions
  saveVersion(data: CreateVersionData): ProjectVersionRow
  listVersions(projectId: string): ProjectVersionRow[]
  getVersion(versionId: string): ProjectVersionRow | null
  getNextVersionNum(projectId: string): number

  // Templates
  createTemplate(row: TemplateRow): TemplateRow
  listTemplates(): TemplateRow[]
  getTemplate(id: string): TemplateRow | null
  deleteTemplate(id: string): void

  // Clauses
  createClause(row: ClauseRow): ClauseRow
  listClauses(opts?: { category?: string; search?: string }): ClauseRow[]
  getClause(id: string): ClauseRow | null
  deleteClause(id: string): void

  // Settings
  getSetting(key: string): string | null
  setSetting(key: string, value: string): void
}
