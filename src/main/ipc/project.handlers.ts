import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from 'shared/ipc/channels'
import type { IpcResponse } from 'shared/ipc/types'
import type { ProjectService } from '../services/project.service'

const ProjectListSchema = z.object({
  includeArchived: z.boolean().optional(),
  search: z.string().max(200).optional(),
})

const ProjectGetSchema = z.object({ id: z.string().min(1).max(64) })

const ProjectCreateSchema = z.object({
  title: z.string().min(1).max(500),
  author: z.string().max(200).optional(),
  content: z.record(z.unknown()).optional(),
})

const ProjectUpdateSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(500).optional(),
  author: z.string().max(200).optional(),
  status: z.enum(['draft', 'needs_review', 'ready_to_export', 'final', 'archived']).optional(),
  content: z.record(z.unknown()).optional(),
})

const ProjectArchiveSchema = z.object({ id: z.string().min(1).max(64) })
const ProjectDeleteSchema = z.object({ id: z.string().min(1).max(64) })

const ProjectSaveVersionSchema = z.object({
  projectId: z.string().min(1).max(64),
  content: z.record(z.unknown()),
  label: z.string().max(100).optional(),
})

const ProjectGetVersionsSchema = z.object({ projectId: z.string().min(1).max(64) })
const ProjectGetVersionSchema = z.object({ versionId: z.string().min(1).max(64) })

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

function err(message: string, code?: string): IpcResponse<never> {
  return { success: false, error: message, code }
}

export function registerProjectHandlers(service: ProjectService): void {
  ipcMain.handle(IPC.PROJECT_LIST, async (_e, raw) => {
    try {
      const req = ProjectListSchema.parse(raw ?? {})
      return ok(service.listProjects(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_GET, async (_e, raw) => {
    try {
      const { id } = ProjectGetSchema.parse(raw)
      const project = service.getProject(id)
      if (!project) return err('Project not found', 'NOT_FOUND')
      return ok(project)
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_CREATE, async (_e, raw) => {
    try {
      const req = ProjectCreateSchema.parse(raw)
      return ok(service.createProject(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_UPDATE, async (_e, raw) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req = ProjectUpdateSchema.parse(raw) as any
      const project = service.updateProject(req)
      if (!project) return err('Project not found', 'NOT_FOUND')
      return ok(project)
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_ARCHIVE, async (_e, raw) => {
    try {
      const { id } = ProjectArchiveSchema.parse(raw)
      service.archiveProject(id)
      return ok({ id })
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_DELETE, async (_e, raw) => {
    try {
      const { id } = ProjectDeleteSchema.parse(raw)
      service.deleteProject(id)
      return ok({ id })
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_SAVE_VERSION, async (_e, raw) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req = ProjectSaveVersionSchema.parse(raw) as any
      return ok(service.saveVersion(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_GET_VERSIONS, async (_e, raw) => {
    try {
      const { projectId } = ProjectGetVersionsSchema.parse(raw)
      return ok(service.listVersions(projectId))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.PROJECT_GET_VERSION, async (_e, raw) => {
    try {
      const { versionId } = ProjectGetVersionSchema.parse(raw)
      const version = service.getVersion(versionId)
      if (!version) return err('Version not found', 'NOT_FOUND')
      return ok(version)
    } catch (e) {
      return err(String(e))
    }
  })
}
