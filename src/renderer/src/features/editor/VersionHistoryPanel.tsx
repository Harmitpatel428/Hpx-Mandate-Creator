import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { History, RotateCcw, Save, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectVersionRecord } from 'shared/ipc/types'
import { formatDateTime } from 'shared/utils/format'

export function VersionHistoryPanel() {
  const currentProject = useProjectStore((s) => s.currentProject)
  const document = useProjectStore((s) => s.document)
  const setDocument = useProjectStore((s) => s.setDocument)
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  const [versions, setVersions] = useState<ProjectVersionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [snapshotting, setSnapshotting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const projectId = currentProject?.id ?? null

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await window.electronAPI.projects.getVersions({ projectId })
      if (res.success) setVersions(res.data)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function handleSnapshot() {
    if (!projectId || !document) return
    setSnapshotting(true)
    try {
      const res = await window.electronAPI.projects.saveVersion({
        projectId,
        content: document,
        label: `Snapshot ${new Date().toLocaleString()}`,
      })
      if (res.success) {
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 1500)
        await load()
      }
    } finally {
      setSnapshotting(false)
    }
  }

  async function handleRestore(versionId: string) {
    if (!projectId) return
    setBusyId(versionId)
    try {
      // Main process backs up the current state before restoring.
      const res = await window.electronAPI.projects.restoreVersion({ projectId, versionId })
      if (res.success) {
        setCurrentProject(res.data)
        setDocument(res.data.content)
      }
      setConfirmId(null)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (!projectId) {
    return <p className="text-xs text-muted-foreground/60 italic">No project loaded</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Snapshots ({versions.length})
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSnapshot}
          disabled={snapshotting || !document}
          title="Save a snapshot of the current document"
        >
          {snapshotting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : justSaved ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Current working state (autosaved in place, not a snapshot) */}
      <div className="rounded border border-primary/40 bg-primary/5 p-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="font-medium text-foreground/90">Current state</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Autosaved · edited {formatDateTime(currentProject?.updatedAt)}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          Use the save icon above (or Ctrl/Cmd+S) to capture a snapshot.
        </p>
      </div>

      {loading && versions.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">Loading…</p>
      ) : versions.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 pt-4 text-center">
          <History className="h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">No snapshots yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => (
            <div
              key={v.id}
              className="rounded border border-border/60 p-2 text-xs hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground/90 truncate">
                  v{v.versionNum}
                  {v.label ? ` · ${v.label}` : ''}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(v.createdAt)}</p>

              {confirmId === v.id ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 text-[10px] px-2"
                    onClick={() => handleRestore(v.id)}
                    disabled={busyId === v.id}
                  >
                    {busyId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm restore'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setConfirmId(null)}
                    disabled={busyId === v.id}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(v.id)}
                  className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
