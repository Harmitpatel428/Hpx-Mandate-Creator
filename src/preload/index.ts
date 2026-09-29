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
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
