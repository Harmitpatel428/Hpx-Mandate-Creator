import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from 'shared/ipc/channels'
import type {
  ProjectListRequest,
  ProjectListResponse,
  ProjectGetRequest,
  ProjectGetResponse,
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectUpdateRequest,
  ProjectUpdateResponse,
  ProjectArchiveRequest,
  ProjectArchiveResponse,
  ProjectDeleteRequest,
  ProjectDeleteResponse,
  ProjectSaveVersionRequest,
  ProjectSaveVersionResponse,
  ProjectGetVersionsRequest,
  ProjectGetVersionsResponse,
  ProjectGetVersionRequest,
  ProjectGetVersionResponse,
  SettingsGetRequest,
  SettingsGetResponse,
  SettingsSetRequest,
  SettingsSetResponse,
  DialogShowSaveRequest,
  DialogShowSaveResponse,
  ExportRequest,
  ExportDocxResponse,
  ExportPdfResponse,
  TemplateCreateRequest,
  TemplateGetRequest,
  TemplateDeleteRequest,
  TemplateInstantiateRequest,
  TemplateListResponse,
  TemplateGetResponse,
  TemplateCreateResponse,
  TemplateDeleteResponse,
  TemplateInstantiateResponse,
  ClauseCreateRequest,
  ClauseListRequest,
  ClauseGetRequest,
  ClauseDeleteRequest,
  ClauseListResponse,
  ClauseGetResponse,
  ClauseCreateResponse,
  ClauseDeleteResponse,
} from 'shared/ipc/types'

const electronAPI = {
  projects: {
    list: (req: ProjectListRequest = {}): Promise<ProjectListResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_LIST, req),
    get: (req: ProjectGetRequest): Promise<ProjectGetResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_GET, req),
    create: (req: ProjectCreateRequest): Promise<ProjectCreateResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_CREATE, req),
    update: (req: ProjectUpdateRequest): Promise<ProjectUpdateResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_UPDATE, req),
    archive: (req: ProjectArchiveRequest): Promise<ProjectArchiveResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_ARCHIVE, req),
    delete: (req: ProjectDeleteRequest): Promise<ProjectDeleteResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_DELETE, req),
    saveVersion: (req: ProjectSaveVersionRequest): Promise<ProjectSaveVersionResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_SAVE_VERSION, req),
    getVersions: (req: ProjectGetVersionsRequest): Promise<ProjectGetVersionsResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_GET_VERSIONS, req),
    getVersion: (req: ProjectGetVersionRequest): Promise<ProjectGetVersionResponse> =>
      ipcRenderer.invoke(IPC.PROJECT_GET_VERSION, req),
  },

  settings: {
    get: (req: SettingsGetRequest): Promise<SettingsGetResponse> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET, req),
    set: (req: SettingsSetRequest): Promise<SettingsSetResponse> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, req),
  },

  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION),
  },

  dialog: {
    showSavePath: (req: DialogShowSaveRequest): Promise<DialogShowSaveResponse> =>
      ipcRenderer.invoke(IPC.DIALOG_SHOW_SAVE, req),
  },

  exports: {
    docx: (req: ExportRequest): Promise<ExportDocxResponse> =>
      ipcRenderer.invoke(IPC.EXPORT_DOCX, req),
    pdf: (req: ExportRequest): Promise<ExportPdfResponse> =>
      ipcRenderer.invoke(IPC.EXPORT_PDF, req),
  },

  templates: {
    list: (): Promise<TemplateListResponse> => ipcRenderer.invoke(IPC.TEMPLATE_LIST),
    get: (req: TemplateGetRequest): Promise<TemplateGetResponse> =>
      ipcRenderer.invoke(IPC.TEMPLATE_GET, req),
    create: (req: TemplateCreateRequest): Promise<TemplateCreateResponse> =>
      ipcRenderer.invoke(IPC.TEMPLATE_CREATE, req),
    delete: (req: TemplateDeleteRequest): Promise<TemplateDeleteResponse> =>
      ipcRenderer.invoke(IPC.TEMPLATE_DELETE, req),
    instantiate: (req: TemplateInstantiateRequest): Promise<TemplateInstantiateResponse> =>
      ipcRenderer.invoke(IPC.TEMPLATE_INSTANTIATE, req),
  },

  clauses: {
    list: (req: ClauseListRequest = {}): Promise<ClauseListResponse> =>
      ipcRenderer.invoke(IPC.CLAUSE_LIST, req),
    get: (req: ClauseGetRequest): Promise<ClauseGetResponse> =>
      ipcRenderer.invoke(IPC.CLAUSE_GET, req),
    create: (req: ClauseCreateRequest): Promise<ClauseCreateResponse> =>
      ipcRenderer.invoke(IPC.CLAUSE_CREATE, req),
    delete: (req: ClauseDeleteRequest): Promise<ClauseDeleteResponse> =>
      ipcRenderer.invoke(IPC.CLAUSE_DELETE, req),
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
