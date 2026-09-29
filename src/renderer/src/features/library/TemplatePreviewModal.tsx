import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Variable as VariableIcon, GitBranch } from 'lucide-react'
import type { TemplateRecord } from 'shared/document-model/library'

interface Props {
  template: TemplateRecord | null
  open: boolean
  onClose: () => void
  onUse: (template: TemplateRecord) => void
}

export function TemplatePreviewModal({ template, open, onClose, onUse }: Props) {
  if (!template) return null
  const doc = template.content
  const visibleSections = doc.sections

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description || 'Template preview'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto text-sm">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {visibleSections.length} sections</span>
            <span className="flex items-center gap-1"><VariableIcon className="h-3.5 w-3.5" /> {doc.variables.length} variables</span>
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {doc.rules.length} rules</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sections</p>
            {visibleSections.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">No sections</p>
            ) : (
              <ol className="space-y-1">
                {visibleSections.map((s, i) => (
                  <li key={s.id} className="flex items-baseline gap-2 text-xs">
                    <span className="font-mono text-muted-foreground/60">{i + 1}.</span>
                    <span className="text-foreground/80">{s.title || 'Untitled'}</span>
                    <span className="text-muted-foreground/50">({s.blocks.length} blocks)</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {doc.variables.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variables</p>
              <div className="flex flex-wrap gap-1">
                {doc.variables.map((v) => (
                  <span key={v.id} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-mono text-foreground/70">
                    {v.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button type="button" size="sm" onClick={() => onUse(template)}>Use this template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
