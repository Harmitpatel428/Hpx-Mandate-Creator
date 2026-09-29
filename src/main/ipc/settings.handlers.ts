import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from 'shared/ipc/channels'
import type { IpcResponse } from 'shared/ipc/types'
import type { SettingsService } from '../services/settings.service'

const GetSchema = z.object({ key: z.string().min(1).max(100) })
const SetSchema = z.object({ key: z.string().min(1).max(100), value: z.unknown() })

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}
function err(message: string): IpcResponse<never> {
  return { success: false, error: message }
}

export function registerSettingsHandlers(service: SettingsService): void {
  ipcMain.handle(IPC.SETTINGS_GET, async (_e, raw) => {
    try {
      const { key } = GetSchema.parse(raw)
      return ok(service.get(key))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.SETTINGS_SET, async (_e, raw) => {
    try {
      const { key, value } = SetSchema.parse(raw)
      service.set(key, value)
      return ok(undefined)
    } catch (e) {
      return err(String(e))
    }
  })
}
