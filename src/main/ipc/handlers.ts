import { ipcMain, app, dialog } from 'electron'
import { IPC } from 'shared/ipc/channels'
import type { ProjectService } from '../services/project.service'
import type { SettingsService } from '../services/settings.service'
import type { LibraryService } from '../services/library.service'
import { registerProjectHandlers } from './project.handlers'
import { registerSettingsHandlers } from './settings.handlers'
import { registerExportHandlers } from './export.handlers'
import { registerLibraryHandlers } from './library.handlers'

export function registerAllHandlers(
  projectService: ProjectService,
  settingsService: SettingsService,
  libraryService: LibraryService,
): void {
  registerProjectHandlers(projectService)
  registerSettingsHandlers(settingsService)
  registerExportHandlers(projectService)
  registerLibraryHandlers(libraryService)

  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())

  ipcMain.handle(IPC.DIALOG_SHOW_SAVE, async (_e, raw: { defaultName?: string; filters?: Electron.FileFilter[] }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: raw?.defaultName ?? 'document',
      filters: raw?.filters ?? [
        { name: 'Word Document', extensions: ['docx'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    return result.canceled ? null : result.filePath
  })
}
