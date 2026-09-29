import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import type { PageSize } from 'shared/document-model/types'

const READY_SIGNAL = 'EXPORT_READY'
const ERROR_SIGNAL = 'EXPORT_ERROR'
const READY_TIMEOUT_MS = 15000

export interface PdfExportOptions {
  pageSize?: PageSize
}

function buildPreviewHash(projectId: string, pageSize?: PageSize): string {
  const query = new URLSearchParams({ export: '1' })
  if (pageSize) query.set('pageSize', pageSize)
  return `/preview/${projectId}?${query.toString()}`
}

/**
 * Wait until the preview renderer signals readiness by setting
 * document.title to EXPORT_READY. Resolves early on EXPORT_ERROR,
 * and rejects after a timeout so a broken render never hangs export.
 */
function waitForReady(win: BrowserWindow): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      win.webContents.removeListener('page-title-updated', onTitle)
      fn()
    }

    const onTitle = (_e: Electron.Event, title: string) => {
      if (title === READY_SIGNAL) finish(resolve)
      else if (title === ERROR_SIGNAL) finish(() => reject(new Error('Preview failed to render')))
    }

    const timer = setTimeout(() => {
      finish(() => reject(new Error('Timed out waiting for preview to render')))
    }, READY_TIMEOUT_MS)

    win.webContents.on('page-title-updated', onTitle)

    // In case the title was already set before listeners attached.
    win.webContents
      .executeJavaScript('document.title')
      .then((title: string) => {
        if (title === READY_SIGNAL) finish(resolve)
        else if (title === ERROR_SIGNAL) finish(() => reject(new Error('Preview failed to render')))
      })
      .catch(() => {
        /* window may not be ready yet; the event listener will handle it */
      })
  })
}

/**
 * Render the read-only preview in a hidden BrowserWindow and print it to
 * a PDF Buffer using Electron's built-in Chromium (webContents.printToPDF).
 * No external PDF engine or Playwright is used.
 */
export async function generatePdfBuffer(
  projectId: string,
  options: PdfExportOptions = {},
): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      offscreen: false,
    },
  })

  try {
    const hash = buildPreviewHash(projectId, options.pageSize)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
    } else {
      await win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
    }

    await waitForReady(win)

    // preferCSSPageSize lets the preview's @page size/margins control the
    // physical page; printBackground keeps shading (notes, table headers).
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
    })

    return pdf
  } finally {
    if (!win.isDestroyed()) win.destroy()
  }
}
