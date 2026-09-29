import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from 'shared/ipc/channels'
import type { IpcResponse } from 'shared/ipc/types'
import type { LibraryService } from '../services/library.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

const TemplateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  content: z.record(z.unknown()),
})
const IdSchema = z.object({ id: z.string().min(1).max(64) })
const TemplateInstantiateSchema = z.object({
  templateId: z.string().min(1).max(64),
  title: z.string().min(1).max(500).optional(),
  author: z.string().max(200).optional(),
})

const ClauseCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  kind: z.enum(['section', 'blocks']),
  section: z.record(z.unknown()).nullable().optional(),
  blocks: z.array(z.record(z.unknown())).optional(),
  variables: z.array(z.record(z.unknown())).optional(),
})
const ClauseListSchema = z.object({
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
})

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}
function err(message: string, code?: string): IpcResponse<never> {
  return { success: false, error: message, code }
}

export function registerLibraryHandlers(service: LibraryService): void {
  // Templates
  ipcMain.handle(IPC.TEMPLATE_LIST, async () => {
    try {
      return ok(service.listTemplates())
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.TEMPLATE_GET, async (_e, raw) => {
    try {
      const { id } = IdSchema.parse(raw)
      const t = service.getTemplate(id)
      if (!t) return err('Template not found', 'NOT_FOUND')
      return ok(t)
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.TEMPLATE_CREATE, async (_e, raw) => {
    try {
      const req = TemplateCreateSchema.parse(raw) as any
      return ok(service.createTemplate(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.TEMPLATE_DELETE, async (_e, raw) => {
    try {
      const { id } = IdSchema.parse(raw)
      service.deleteTemplate(id)
      return ok({ id })
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.TEMPLATE_INSTANTIATE, async (_e, raw) => {
    try {
      const req = TemplateInstantiateSchema.parse(raw)
      const project = service.instantiateTemplate(req)
      if (!project) return err('Template not found', 'NOT_FOUND')
      return ok(project)
    } catch (e) {
      return err(String(e))
    }
  })

  // Clauses
  ipcMain.handle(IPC.CLAUSE_LIST, async (_e, raw) => {
    try {
      const req = ClauseListSchema.parse(raw ?? {})
      return ok(service.listClauses(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.CLAUSE_GET, async (_e, raw) => {
    try {
      const { id } = IdSchema.parse(raw)
      const c = service.getClause(id)
      if (!c) return err('Clause not found', 'NOT_FOUND')
      return ok(c)
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.CLAUSE_CREATE, async (_e, raw) => {
    try {
      const req = ClauseCreateSchema.parse(raw) as any
      return ok(service.createClause(req))
    } catch (e) {
      return err(String(e))
    }
  })

  ipcMain.handle(IPC.CLAUSE_DELETE, async (_e, raw) => {
    try {
      const { id } = IdSchema.parse(raw)
      service.deleteClause(id)
      return ok({ id })
    } catch (e) {
      return err(String(e))
    }
  })
}
