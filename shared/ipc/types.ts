import type { MandateDocument, DocumentStatus, Section, Block, Variable } from '../document-model/types'
import type { TemplateRecord, ClauseRecord, ClauseKind } from '../document-model/library'
import type { PageSizeSchema } from '../document-model/schema'
import type { z } from 'zod'

export type PageSize = z.infer<typeof PageSizeSchema>

export type IpcResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// ---- Project records ----

export interface ProjectRecord {
  id: string
  title: string
  author: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  content: MandateDocument
}

export interface ProjectVersionRecord {
  id: string
  projectId: string
  versionNum: number
  content: MandateDocument
  createdAt: string
  label: string | null
}

// ---- Request payloads ----

export interface ProjectListRequest {
  includeArchived?: boolean
  search?: string
}

export interface ProjectGetRequest {
  id: string
}

export interface ProjectCreateRequest {
  title: string
  author?: string
  content?: Partial<MandateDocument>
}

export interface ProjectUpdateRequest {
  id: string
  title?: string
  author?: string
  status?: DocumentStatus
  content?: MandateDocument
}

export interface ProjectArchiveRequest {
  id: string
}

export interface ProjectDeleteRequest {
  id: string
}

export interface ProjectSaveVersionRequest {
  projectId: string
  content: MandateDocument
  label?: string
}

export interface ProjectGetVersionsRequest {
  projectId: string
}

export interface ProjectGetVersionRequest {
  versionId: string
}

export interface SettingsGetRequest {
  key: string
}

export interface SettingsSetRequest {
  key: string
  value: unknown
}

export interface DialogShowSaveRequest {
  defaultName: string
  filters?: Array<{ name: string; extensions: string[] }>
}

// ---- Export ----

export interface ValidationIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
  targetId: string
  targetType: 'block' | 'section' | 'variable' | 'document'
}

export interface ExportRequest {
  projectId: string
  filePath: string
  pageSize?: PageSize
}

export interface ExportResult {
  filePath: string
}

/**
 * When export is blocked by server-side validation, the response is a
 * failure carrying the validation errors so the renderer can surface them.
 */
export type ExportResponse =
  | { success: true; data: ExportResult }
  | { success: false; error: string; code?: string; issues?: ValidationIssue[] }

// ---- Response aliases ----

export type ProjectListResponse = IpcResponse<ProjectRecord[]>
export type ProjectGetResponse = IpcResponse<ProjectRecord>
export type ProjectCreateResponse = IpcResponse<ProjectRecord>
export type ProjectUpdateResponse = IpcResponse<ProjectRecord>
export type ProjectArchiveResponse = IpcResponse<{ id: string }>
export type ProjectDeleteResponse = IpcResponse<{ id: string }>
export type ProjectSaveVersionResponse = IpcResponse<ProjectVersionRecord>
export type ProjectGetVersionsResponse = IpcResponse<ProjectVersionRecord[]>
export type ProjectGetVersionResponse = IpcResponse<ProjectVersionRecord>
export type SettingsGetResponse = IpcResponse<unknown>
export type SettingsSetResponse = IpcResponse<void>
export type DialogShowSaveResponse = IpcResponse<string | null>
export type ExportDocxResponse = ExportResponse
export type ExportPdfResponse = ExportResponse

// ---- Template library ----

export interface TemplateCreateRequest {
  name: string
  description?: string
  category?: string
  content: MandateDocument
}
export interface TemplateGetRequest { id: string }
export interface TemplateDeleteRequest { id: string }
export interface TemplateInstantiateRequest {
  templateId: string
  title?: string
  author?: string
}

export type TemplateListResponse = IpcResponse<TemplateRecord[]>
export type TemplateGetResponse = IpcResponse<TemplateRecord>
export type TemplateCreateResponse = IpcResponse<TemplateRecord>
export type TemplateDeleteResponse = IpcResponse<{ id: string }>
export type TemplateInstantiateResponse = IpcResponse<ProjectRecord>

// ---- Clause library ----

export interface ClauseCreateRequest {
  name: string
  description?: string
  category?: string
  tags?: string[]
  kind: ClauseKind
  section?: Section | null
  blocks?: Block[]
  variables?: Variable[]
}
export interface ClauseListRequest { category?: string; search?: string }
export interface ClauseGetRequest { id: string }
export interface ClauseDeleteRequest { id: string }

export type ClauseListResponse = IpcResponse<ClauseRecord[]>
export type ClauseGetResponse = IpcResponse<ClauseRecord>
export type ClauseCreateResponse = IpcResponse<ClauseRecord>
export type ClauseDeleteResponse = IpcResponse<{ id: string }>
