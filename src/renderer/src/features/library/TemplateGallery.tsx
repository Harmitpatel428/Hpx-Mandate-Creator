import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate, Trash2, Eye, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TemplatePreviewModal } from './TemplatePreviewModal'
import { useProjectStore } from '@/stores/projectStore'
import type { TemplateRecord } from 'shared/document-model/library'

export function TemplateGallery() {
  const navigate = useNavigate()
  const upsertProject = useProjectStore((s) => s.upsertProject)
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<TemplateRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.templates.list()
      if (res.success) setTemplates(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function useTemplate(t: TemplateRecord) {
    setBusyId(t.id)
    try {
      const res = await window.electronAPI.templates.instantiate({ templateId: t.id })
      if (res.success) {
        upsertProject(res.data)
        setPreview(null)
        navigate(`/editor/${res.data.id}`)
      }
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const res = await window.electronAPI.templates.delete({ id: deleteTarget.id })
    if (res.success) setTemplates((ts) => ts.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <LayoutTemplate className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Open a mandate and choose “Save as template” to reuse its structure.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="group flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {t.name}
                  {t.isSample && (
                    <span className="ml-1.5 rounded bg-primary/15 text-primary px-1.5 py-px text-[9px] uppercase tracking-wide align-middle">
                      Sample
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.category}</p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all shrink-0"
                onClick={() => setDeleteTarget(t)}
                title="Delete template"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {t.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{t.description}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              {t.content.sections.length} sections · {t.content.variables.length} variables
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" className="flex-1" onClick={() => useTemplate(t)} disabled={busyId === t.id}>
                {busyId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-1" /> Use</>}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreview(t)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <TemplatePreviewModal template={preview} open={!!preview} onClose={() => setPreview(null)} onUse={useTemplate} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete template?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </>
  )
}
