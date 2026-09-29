import * as React from 'react'
import { useEffect, useState } from 'react'
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
import { CheckCircle2 } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { TEMPLATE_CATEGORIES } from 'shared/document-model/library'

interface Props {
  open: boolean
  onClose: () => void
}

export function SaveTemplateModal({ open, onClose }: Props) {
  const document = useProjectStore((s) => s.document)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('General')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && document) {
      setName(document.metadata.title || 'Untitled Template')
      setDescription(document.metadata.description || '')
      setCategory('General')
      setDone(false)
      setError(null)
    }
  }, [open, document])

  async function handleSave() {
    if (!document || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await window.electronAPI.templates.create({
        name: name.trim(),
        description: description.trim(),
        category,
        content: document,
      })
      if (res.success) {
        setDone(true)
        setTimeout(onClose, 900)
      } else setError(res.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>
            Save the current mandate as a reusable template. New mandates can be created from it.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Template saved.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        {!done && (
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="button" size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
