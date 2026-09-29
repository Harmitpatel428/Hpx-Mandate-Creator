export const IPC = {
  PROJECT_LIST: 'project:list',
  PROJECT_GET: 'project:get',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_ARCHIVE: 'project:archive',
  PROJECT_DELETE: 'project:delete',
  PROJECT_SAVE_VERSION: 'project:save-version',
  PROJECT_GET_VERSIONS: 'project:get-versions',
  PROJECT_GET_VERSION: 'project:get-version',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  EXPORT_DOCX: 'export:docx',
  EXPORT_PDF: 'export:pdf',

  APP_GET_VERSION: 'app:get-version',
  DIALOG_SHOW_SAVE: 'dialog:show-save',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
