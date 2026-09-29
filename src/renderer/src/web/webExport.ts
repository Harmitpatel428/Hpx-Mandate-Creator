import { Packer } from 'docx'
import { buildDocxDocument } from 'shared/export/docx-builder'
import type { MandateDocument, PageSize } from 'shared/document-model/types'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Build the DOCX in-browser and trigger a download via a Blob URL. */
export async function downloadDocx(doc: MandateDocument, filename: string, pageSize?: PageSize): Promise<void> {
  const blob = await Packer.toBlob(buildDocxDocument(doc, { pageSize }))
  triggerDownload(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function waitForPreviewReady(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (document.title === 'EXPORT_READY') return
    await sleep(100)
  }
}

/**
 * Web-mode PDF: navigate to the chrome-free preview and invoke the browser's
 * print dialog, from which the user can "Save as PDF". Native one-click PDF
 * (Electron printToPDF) ships only in the desktop build.
 */
export async function printPreview(projectId: string, pageSize?: PageSize): Promise<void> {
  const returnHash = window.location.hash
  const q = new URLSearchParams({ export: '1' })
  if (pageSize) q.set('pageSize', pageSize)
  window.location.hash = `#/preview/${projectId}?${q.toString()}`
  await waitForPreviewReady()
  window.alert(
    'Web preview: choose "Save as PDF" in your browser\'s print dialog.\n\nOne-click native PDF export ships in the desktop build.',
  )
  window.print()
  window.location.hash = returnHash
}
