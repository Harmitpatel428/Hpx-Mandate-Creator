import * as React from 'react'
import { useState, useMemo } from 'react'
import { Plus, Variable as VariableIcon } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import type { Variable } from 'shared/document-model/types'
import { Button } from '@/components/ui/button'
import { VariableRow } from './VariableRow'
import { VariableForm } from './VariableForm'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { extractPlaceholderKeysFromTiptapJson, extractPlaceholderKeys } from '@/lib/parse-placeholders'

export function VariablesPanel() {
  const document = useProjectStore((s) => s.document)
  const { addVariable, updateVariable, removeVariable } = useProjectStore()

  const [showForm, setShowForm] = useState(false)
  const [editingVar, setEditingVar] = useState<Variable | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Variable | null>(null)

  const variables = document?.variables ?? []

  // Count usage per variable key across all blocks
  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const section of document?.sections ?? []) {
      for (const block of section.blocks) {
        let keys: string[] = []
        if (block.type === 'paragraph') {
          keys = extractPlaceholderKeysFromTiptapJson(block.content)
        } else if ('content' in block && typeof block.content === 'string') {
          keys = extractPlaceholderKeys(block.content)
        }
        for (const k of keys) {
          counts[k] = (counts[k] ?? 0) + 1
        }
      }
    }
    return counts
  }, [document])

  function handleAdd(data: Omit<Variable, 'id'>) {
    addVariable(data)
    setShowForm(false)
  }

  function handleUpdate(data: Omit<Variable, 'id'>) {
    if (!editingVar) return
    updateVariable(editingVar.id, data)
    setEditingVar(null)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    removeVariable(deleteTarget.id)
    setDeleteTarget(null)
  }

  const deleteUsageCount = deleteTarget ? (usageCounts[deleteTarget.key] ?? 0) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Variables ({variables.length})
        </p>
        {!showForm && !editingVar && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6"
            onClick={() => setShowForm(true)}
            title="Add variable"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Inline form for new variable */}
      {showForm && (
        <div className="border border-border/60 rounded-md p-3 bg-secondary/20">
          <VariableForm
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingVar && (
        <div className="border border-border/60 rounded-md p-3 bg-secondary/20">
          <VariableForm
            initial={editingVar}
            onSave={handleUpdate}
            onCancel={() => setEditingVar(null)}
          />
        </div>
      )}

      {/* Variable list */}
      {variables.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <VariableIcon className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/60">No variables yet</p>
          <p className="text-[10px] text-muted-foreground/40">Use {'{{key}}'} in text</p>
          <Button size="sm" variant="outline" className="h-7 text-xs mt-1" onClick={() => setShowForm(true)}>
            Add first variable
          </Button>
        </div>
      ) : (
        <div className="space-y-0.5">
          {variables.map((v) => (
            <VariableRow
              key={v.id}
              variable={v}
              usageCount={usageCounts[v.key] ?? 0}
              onEdit={() => { setShowForm(false); setEditingVar(v) }}
              onDelete={() => setDeleteTarget(v)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variable?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.key}</strong> will be removed.
              {deleteUsageCount > 0 && (
                <span className="text-amber-600 block mt-1">
                  ⚠ This variable is referenced {deleteUsageCount} time{deleteUsageCount !== 1 ? 's' : ''} in the document. Those references will become unresolved.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
