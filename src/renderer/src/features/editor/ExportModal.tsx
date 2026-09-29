import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { FileText, FileType, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/stores/projectStore'
import { useProject } from '@/hooks/useProject'
import { validateDocument, hasErrors, type ValidationResult } from 'shared/validation-engine'
import type { PageSize } from 'shared/ipc/types'

interface Props {
  open: boolean
  onClose: () => void
}

type ExportFormat = 'docx' | 'pdf'
type Phase = 'idle' | 'saving' | 'exporting' | 'done' | 'error'

const PAGE_SIZES: PageSize[] = ['A4', 'Letter', 'Legal']

function sanitizeFilename(name: string): string {
  return (name || 'mandate').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || 'mandate'
}

export function ExportModal({ open, onClose }: Props) {
  const document = useProjectStore((s) => s.document)
  const currentProject = useProjectStore((s) => s.currentProject)
  const { updateProject } = useProject()

  const [format, setFormat] = useState<ExportFormat>('docx')
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [filename, setFilename] = useState('mandate')
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [serverIssues, setServerIssues] = useState<string[]>([])

  const validation: ValidationResult[] = useMemo(
    () => (document && open ? validateDocument(document) : []),
    [document, open],
  )
  const errors = validation.filter((v) => v.severity === 'error')
  const warnings = validation.filter((v) => v.severity === 'warning')
  const blocked = hasErrors(validation)

  useEffect(() => {
    if (open && document) {
      setFilename(sanitizeFilename(document.metadata.title))
      setPageSize((document.pageSettings.pageSize as PageSize) || 'A4')
      setPhase('idle')
      setMessage(null)
      setServerIssues([])
    }
  }, [open, document])

  async function handleExport() {
    if (!currentProject || !document || blocked) return
    setPhase('saving')
    setMessage(null)
    setServerIssues([])

    try {
      // Persist the current in-memory document so the main process exports
      // exactly what the user sees, then re-validates it server-side.
      await updateProject({ id: currentProject.id, content: document })

      const ext = format === 'docx' ? 'docx' : 'pdf'
      const filterName = format === 'docx' ? 'Word Document' : 'PDF Document'
      const filePath = await window.electronAPI.dialog.showSavePath({
        defaultName: `${sanitizeFilename(filename)}.${ext}`,
        filters: [{ name: filterName, extensions: [ext] }],
      })

      if (!filePath.success || !filePath.data) {
        setPhase('idle')
        return
      }

      setPhase('exporting')
      const req = { projectId: currentProject.id, filePath: filePath.data, pageSize }
      const res = format === 'docx'
        ? await window.electronAPI.exports.docx(req)
        : await window.electronAPI.exports.pdf(req)

      if (res.success) {
        setPhase('done')
        setMessage(`Exported to ${res.data.filePath}`)
      } else {
        setPhase('error')
        setMessage(res.error)
        if (res.issues) setServerIssues(res.issues.map((i) => i.message))
      }
    } catch (err) {
      setPhase('error')
      setMessage(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const busy = phase === 'saving' || phase === 'exporting'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export document</DialogTitle>
          <DialogDescription>
            Choose a format and page size. The document is re-validated before export.
          </DialogDescription>
        </DialogHeader>

        {/* Validation gate */}
        {blocked ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {errors.length} error{errors.length === 1 ? '' : 's'} must be fixed before export
            </div>
            <ul className="text-xs text-destructive/90 space-y-0.5 list-disc pl-5 max-h-32 overflow-auto">
              {errors.map((e) => (
                <li key={e.id}>{e.message}</li>
              ))}
            </ul>
          </div>
        ) : (
          warnings.length > 0 && (
            <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2.5 text-xs text-yellow-700 dark:text-yellow-400">
              {warnings.length} warning{warnings.length === 1 ? '' : 's'} — export is allowed but review recommended.
            </div>
          )
        )}

        {!blocked && (
          <div className="space-y-4">
            {/* Format selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(['docx', 'pdf'] as ExportFormat[]).map((f) => {
                  const Icon = f === 'docx' ? FileText : FileType
                  return (
                    <button
                      key={f}
                      type="button"
                      disabled={busy}
                      onClick={() => setFormat(f)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        format === f
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-foreground/70 hover:bg-secondary',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {f === 'docx' ? 'Word (.docx)' : 'PDF (.pdf)'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Page size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Page size</label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)} disabled={busy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((ps) => (
                    <SelectItem key={ps} value={ps}>
                      {ps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filename */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">File name</label>
              <div className="flex items-center gap-2">
                <Input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  disabled={busy}
                  maxLength={120}
                />
                <span className="text-xs text-muted-foreground shrink-0">.{format}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status message */}
        {message && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-md p-2.5 text-xs',
              phase === 'done'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            {phase === 'done' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 break-all">
              <p>{message}</p>
              {serverIssues.length > 0 && (
                <ul className="list-disc pl-4">
                  {serverIssues.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" disabled={busy}>
              {phase === 'done' ? 'Close' : 'Cancel'}
            </Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleExport} disabled={blocked || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {phase === 'saving' ? 'Saving…' : phase === 'exporting' ? 'Exporting…' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
