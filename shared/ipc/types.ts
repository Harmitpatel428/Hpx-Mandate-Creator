import type { MandateDocument, DocumentStatus } from '../document-model/types'

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
