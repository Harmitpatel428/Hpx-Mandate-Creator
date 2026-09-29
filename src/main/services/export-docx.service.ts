import { Packer } from 'docx'
import type { MandateDocument } from 'shared/document-model/types'
import { buildDocxDocument, type DocxExportOptions } from 'shared/export/docx-builder'

export type { DocxExportOptions }

/** Build a .docx Buffer from a mandate document (main process). */
export async function generateDocxBuffer(
  doc: MandateDocument,
  options: DocxExportOptions = {},
): Promise<Buffer> {
  return Packer.toBuffer(buildDocxDocument(doc, options))
}
