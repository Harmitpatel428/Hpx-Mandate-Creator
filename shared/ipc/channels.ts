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
  PROJECT_RESTORE_VERSION: 'project:restore-version',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  EXPORT_DOCX: 'export:docx',
  EXPORT_PDF: 'export:pdf',

  TEMPLATE_LIST: 'template:list',
  TEMPLATE_GET: 'template:get',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_DELETE: 'template:delete',
  TEMPLATE_INSTANTIATE: 'template:instantiate',

  CLAUSE_LIST: 'clause:list',
  CLAUSE_GET: 'clause:get',
  CLAUSE_CREATE: 'clause:create',
  CLAUSE_DELETE: 'clause:delete',

  APP_GET_VERSION: 'app:get-version',
  DIALOG_SHOW_SAVE: 'dialog:show-save',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
