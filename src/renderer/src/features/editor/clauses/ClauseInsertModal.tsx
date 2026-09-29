import * as React from 'react'
import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/projectStore'
import { insertClauseIntoDocument } from 'shared/document-model/clause-insert'
import type { ClauseRecord } from 'shared/document-model/library'

const NEW_SECTION = '__new__'
const ADD_NEW = '__add_new__'

interface Props {
  open: boolean
  onClose: () => void
  clause: ClauseRecord | null
}

export function ClauseInsertModal({ open, onClose, clause }: Props) {
  const document = useProjectStore((s) => s.document)
  const setDocument = useProjectStore((s) => s.setDocument)
  const setSaveState = useProjectStore((s) => s.setSaveState)

  // Per clause-variable mapping choice: ADD_NEW or an existing doc key.
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [targetSectionId, setTargetSectionId] = useState<string>(NEW_SECTION)

  React.useEffect(() => {
    if (open && clause && document) {
      const initial: Record<string, string> = {}
      for (const v of clause.variables) {
        // Auto-map to an existing same-key variable when present.
        initial[v.key] = document.variables.some((dv) => dv.key === v.key) ? v.key : ADD_NEW
      }
      setMapping(initial)
      setTargetSectionId(document.sections[0]?.id ?? NEW_SECTION)
    }
  }, [open, clause, document])

  const keyRemap = useMemo(() => {
    const remap: Record<string, string> = {}
    if (clause) {
      for (const v of clause.variables) {
        const choice = mapping[v.key]
        if (choice && choice !== ADD_NEW && choice !== v.key) remap[v.key] = choice
      }
    }
    return remap
  }, [clause, mapping])

  const missingRequired = useMemo(() => {
    if (!clause || !document) return []
    const preview = insertClauseIntoDocument(document, clause, { keyRemap, targetSectionId: targetSectionId === NEW_SECTION ? undefined : targetSectionId })
    return preview.missingRequired
  }, [clause, document, keyRemap, targetSectionId])

  if (!clause) return null

  function handleInsert() {
    if (!clause || !document) return
    const { doc } = insertClauseIntoDocument(document, clause, {
      keyRemap,
      targetSectionId: targetSectionId === NEW_SECTION ? undefined : targetSectionId,
    })
    setDocument(doc)
    setSaveState('unsaved')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert clause: {clause.name}</DialogTitle>
          <DialogDescription>{clause.description || 'Insert this clause into the current document.'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Target section (only for block clauses) */}
          {clause.kind === 'blocks' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Insert into</label>
              <Select value={targetSectionId} onValueChange={setTargetSectionId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {document?.sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title || 'Untitled section'}</SelectItem>
                  ))}
                  <SelectItem value={NEW_SECTION}>+ New section</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Variable remapping */}
          {clause.variables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Variable mapping</p>
              {clause.variables.map((v) => {
                const compatible = document?.variables.filter((dv) => dv.type === v.type) ?? []
                return (
                  <div key={v.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                    <span className="font-mono text-foreground/80 truncate" title={v.label}>
                      {'{{'}{v.key}{'}}'}
                      {v.required && <span className="text-destructive ml-1">*</span>}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <Select value={mapping[v.key] ?? ADD_NEW} onValueChange={(val) => setMapping((m) => ({ ...m, [v.key]: val }))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ADD_NEW}>Add as new variable</SelectItem>
                        {compatible.map((dv) => (
                          <SelectItem key={dv.id} value={dv.key}>Map to {dv.label} ({dv.key})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}

          {/* Missing-required warning */}
          {missingRequired.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2.5 text-xs text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Required variables need values after insert:</p>
                <p className="font-mono mt-0.5">{missingRequired.map((k) => `{{${k}}}`).join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleInsert}>Insert clause</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
