import * as React from 'react'
import { useMemo, useState } from 'react'
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
import { useProjectStore } from '@/stores/projectStore'
import { collectClauseKeys } from 'shared/document-model/clause-insert'
import { CLAUSE_CATEGORIES, type ClauseRecord } from 'shared/document-model/library'
import type { Section, Block } from 'shared/document-model/types'

export type ClausePayload =
  | { kind: 'section'; section: Section }
  | { kind: 'blocks'; blocks: Block[] }

interface Props {
  open: boolean
  onClose: () => void
  payload: ClausePayload | null
}

export function SaveClauseModal({ open, onClose, payload }: Props) {
  const document = useProjectStore((s) => s.document)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('General')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Variables the clause references, derived from the document definitions.
  const referencedVariables = useMemo(() => {
    if (!payload || !document) return []
    const pseudo: ClauseRecord = {
      id: '', name: '', description: '', category: '', tags: [], isSample: false,
      kind: payload.kind,
      section: payload.kind === 'section' ? payload.section : null,
      blocks: payload.kind === 'blocks' ? payload.blocks : [],
      variables: [],
      createdAt: '', updatedAt: '',
    }
    const keys = new Set(collectClauseKeys(pseudo))
    return document.variables.filter((v) => keys.has(v.key))
  }, [payload, document])

  React.useEffect(() => {
    if (open) {
      setName(payload?.kind === 'section' ? payload.section.title || 'Untitled clause' : '')
      setDescription('')
      setCategory('General')
      setError(null)
    }
  }, [open, payload])

  async function handleSave() {
    if (!payload || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await window.electronAPI.clauses.create({
        name: name.trim(),
        description: description.trim(),
        category,
        tags: [],
        kind: payload.kind,
        section: payload.kind === 'section' ? payload.section : null,
        blocks: payload.kind === 'blocks' ? payload.blocks : [],
        variables: referencedVariables,
      })
      if (res.success) onClose()
      else setError(res.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save clause')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as clause</DialogTitle>
          <DialogDescription>
            Save this {payload?.kind === 'section' ? 'section' : 'content'} to the clause library for reuse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Confidentiality" autoFocus maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional summary" maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLAUSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {referencedVariables.length > 0 && (
            <div className="rounded-md border border-border/60 bg-secondary/40 p-2.5 text-xs">
              <p className="font-medium text-foreground/80 mb-1">
                {referencedVariables.length} variable{referencedVariables.length === 1 ? '' : 's'} will be saved with this clause:
              </p>
              <div className="flex flex-wrap gap-1">
                {referencedVariables.map((v) => (
                  <span key={v.id} className="rounded bg-primary/10 text-primary px-1.5 py-0.5 font-mono">
                    {'{{'}{v.key}{'}}'}
                  </span>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save clause'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
