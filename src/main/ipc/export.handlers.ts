import { ipcMain } from 'electron'
import { writeFile } from 'fs/promises'
import { IPC } from 'shared/ipc/channels'
import type { ExportRequest, ExportResponse, ValidationIssue } from 'shared/ipc/types'
import type { ProjectService } from '../services/project.service'
import { validateDocument, hasErrors } from 'shared/validation-engine'
import { generateDocxBuffer } from '../services/export-docx.service'
import { generatePdfBuffer } from '../services/export-pdf.service'

function toIssues(results: ReturnType<typeof validateDocument>): ValidationIssue[] {
  return results.map((r) => ({
    code: r.code,
    severity: r.severity,
    message: r.message,
    targetId: r.targetId,
    targetType: r.targetType,
  }))
}

/**
 * Load the persisted document and re-validate it in the main process.
 * Returns the document when clean, or a failure response carrying the
 * blocking validation issues. This is the authoritative gate — the
 * renderer's pre-check is only for UX.
 */
function loadAndValidate(
  projectService: ProjectService,
  projectId: string,
): { ok: true; doc: import('shared/document-model/types').MandateDocument } | { ok: false; response: ExportResponse } {
  const project = projectService.getProject(projectId)
  if (!project) {
    return { ok: false, response: { success: false, error: 'Project not found', code: 'not_found' } }
  }
  const results = validateDocument(project.content)
  if (hasErrors(results)) {
    return {
      ok: false,
      response: {
        success: false,
        error: 'Document has validation errors and cannot be exported.',
        code: 'validation_failed',
        issues: toIssues(results.filter((r) => r.severity === 'error')),
      },
    }
  }
  return { ok: true, doc: project.content }
}

export function registerExportHandlers(projectService: ProjectService): void {
  ipcMain.handle(IPC.EXPORT_DOCX, async (_e, req: ExportRequest): Promise<ExportResponse> => {
    try {
      const gate = loadAndValidate(projectService, req.projectId)
      if (!gate.ok) return gate.response

      const buffer = await generateDocxBuffer(gate.doc, { pageSize: req.pageSize })
      await writeFile(req.filePath, buffer)
      return { success: true, data: { filePath: req.filePath } }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'DOCX export failed' }
    }
  })

  ipcMain.handle(IPC.EXPORT_PDF, async (_e, req: ExportRequest): Promise<ExportResponse> => {
    try {
      const gate = loadAndValidate(projectService, req.projectId)
      if (!gate.ok) return gate.response

      const buffer = await generatePdfBuffer(req.projectId, { pageSize: req.pageSize })
      await writeFile(req.filePath, buffer)
      return { success: true, data: { filePath: req.filePath } }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'PDF export failed' }
    }
  })
}
