import { BrowserRepository } from './browserRepo'
import { downloadDocx, printPreview } from './webExport'
import { createDefaultDocument } from 'shared/document-model/defaults'
import { cloneDocumentWithNewIds } from 'shared/document-model/clone'
import { generateId } from 'shared/utils/id'
import { validateDocument, hasErrors } from 'shared/validation-engine'
import { buildSampleMandate, buildSampleTemplateDoc, buildSampleClauses } from 'shared/seed/sample-content'
import type { IpcResponse, ExportResponse, ValidationIssue } from 'shared/ipc/types'

const repo = new BrowserRepository()
const SEED_FLAG = 'seed:v1'

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}
function err(message: string, code?: string): IpcResponse<never> {
  return { success: false, error: message, code }
}
const now = () => new Date().toISOString()

function seedIfFirstRun(): void {
  if (repo.getSetting(SEED_FLAG)) return
  const ts = now()
  const mandate = buildSampleMandate()
  repo.createProject({
    id: mandate.id, title: mandate.metadata.title, author: mandate.metadata.author,
    status: 'draft', createdAt: ts, updatedAt: ts, content: mandate,
  })
  const templateDoc = buildSampleTemplateDoc()
  repo.createTemplate({
    id: generateId(), name: 'Mutual NDA (Sample)', description: templateDoc.metadata.description,
    category: 'NDA', isSample: true, createdAt: ts, updatedAt: ts, content: templateDoc,
  })
  for (const clause of buildSampleClauses(ts)) repo.createClause(clause)
  repo.setSetting(SEED_FLAG, ts)
}

function toIssues(results: ReturnType<typeof validateDocument>): ValidationIssue[] {
  return results
    .filter((r) => r.severity === 'error')
    .map((r) => ({ code: r.code, severity: r.severity, message: r.message, targetId: r.targetId, targetType: r.targetType }))
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() || p
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const electronAPI = {
  projects: {
    async list(req: any = {}) { return ok(repo.listProjects(req)) },
    async get(req: any) { const p = repo.getProject(req.id); return p ? ok(p) : err('Project not found', 'NOT_FOUND') },
    async create(req: any) {
      const id = generateId()
      const content = createDefaultDocument({ id, title: req.title, author: req.author })
      if (req.content?.metadata) Object.assign(content.metadata, req.content.metadata)
      const ts = now()
      return ok(repo.createProject({ id, title: req.title, author: req.author ?? '', status: 'draft', createdAt: ts, updatedAt: ts, content }))
    },
    async update(req: any) {
      const r = repo.updateProject({ id: req.id, title: req.title, author: req.author, status: req.status, content: req.content, updatedAt: now() })
      return r ? ok(r) : err('Project not found', 'NOT_FOUND')
    },
    async archive(req: any) { repo.archiveProject(req.id, now()); return ok({ id: req.id }) },
    async delete(req: any) { repo.deleteProject(req.id); return ok({ id: req.id }) },
    async saveVersion(req: any) {
      const ts = now()
      const versionNum = repo.getNextVersionNum(req.projectId)
      const version = repo.saveVersion({ id: generateId(), projectId: req.projectId, versionNum, content: req.content, createdAt: ts, label: req.label ?? `v${versionNum}` })
      repo.updateProject({ id: req.projectId, content: req.content, updatedAt: ts })
      return ok(version)
    },
    async getVersions(req: any) { return ok(repo.listVersions(req.projectId)) },
    async getVersion(req: any) { const v = repo.getVersion(req.versionId); return v ? ok(v) : err('Version not found', 'NOT_FOUND') },
    async restoreVersion(req: any) {
      const current = repo.getProject(req.projectId)
      const version = repo.getVersion(req.versionId)
      if (!current || !version) return err('Project or version not found', 'NOT_FOUND')
      const updated = repo.updateProject({ id: req.projectId, content: version.content, updatedAt: now() })
      return updated ? ok(updated) : err('Restore failed')
    },
  },

  settings: {
    async get(req: any) {
      const raw = repo.getSetting(req.key)
      try { return ok(raw === null ? null : JSON.parse(raw)) } catch { return ok(raw) }
    },
    async set(req: any) { repo.setSetting(req.key, JSON.stringify(req.value)); return ok(undefined) },
  },

  app: {
    async getVersion() { return '0.1.0' },
  },

  dialog: {
    // Browsers cannot choose a path; return the suggested filename.
    async showSavePath(req: any) { return ok(req.defaultName) as any },
  },

  exports: {
    async docx(req: any): Promise<ExportResponse> {
      const p = repo.getProject(req.projectId)
      if (!p) return err('Project not found', 'NOT_FOUND')
      const results = validateDocument(p.content)
      if (hasErrors(results)) return { success: false, error: 'Document has validation errors and cannot be exported.', code: 'validation_failed', issues: toIssues(results) }
      await downloadDocx(p.content, basename(req.filePath), req.pageSize)
      return { success: true, data: { filePath: basename(req.filePath) } }
    },
    async pdf(req: any): Promise<ExportResponse> {
      const p = repo.getProject(req.projectId)
      if (!p) return err('Project not found', 'NOT_FOUND')
      const results = validateDocument(p.content)
      if (hasErrors(results)) return { success: false, error: 'Document has validation errors and cannot be exported.', code: 'validation_failed', issues: toIssues(results) }
      await printPreview(req.projectId, req.pageSize)
      return { success: true, data: { filePath: '(browser print dialog)' } }
    },
  },

  templates: {
    async list() { return ok(repo.listTemplates()) },
    async get(req: any) { const t = repo.getTemplate(req.id); return t ? ok(t) : err('Template not found', 'NOT_FOUND') },
    async create(req: any) {
      const ts = now()
      return ok(repo.createTemplate({ id: generateId(), name: req.name, description: req.description ?? '', category: req.category ?? 'General', isSample: false, createdAt: ts, updatedAt: ts, content: req.content }))
    },
    async delete(req: any) { repo.deleteTemplate(req.id); return ok({ id: req.id }) },
    async instantiate(req: any) {
      const t = repo.getTemplate(req.templateId)
      if (!t) return err('Template not found', 'NOT_FOUND')
      const id = generateId()
      const content = cloneDocumentWithNewIds(t.content, { id, title: req.title ?? t.name, author: req.author, status: 'draft' })
      const ts = now()
      return ok(repo.createProject({ id, title: content.metadata.title, author: content.metadata.author, status: 'draft', createdAt: ts, updatedAt: ts, content }))
    },
  },

  clauses: {
    async list(req: any = {}) { return ok(repo.listClauses({ category: req.category, search: req.search })) },
    async get(req: any) { const c = repo.getClause(req.id); return c ? ok(c) : err('Clause not found', 'NOT_FOUND') },
    async create(req: any) {
      const ts = now()
      return ok(repo.createClause({ id: generateId(), name: req.name, description: req.description ?? '', category: req.category ?? 'General', tags: req.tags ?? [], isSample: false, kind: req.kind, section: req.section ?? null, blocks: req.blocks ?? [], variables: req.variables ?? [], createdAt: ts, updatedAt: ts }))
    },
    async delete(req: any) { repo.deleteClause(req.id); return ok({ id: req.id }) },
  },
}

/** Install the localStorage-backed ElectronAPI shim for the web dev build. */
export function installWebShim(): void {
  seedIfFirstRun()
  ;(window as any).electronAPI = electronAPI
  ;(window as any).__WEB_MODE__ = true
  console.warn('[web] localStorage ElectronAPI shim installed')
}
