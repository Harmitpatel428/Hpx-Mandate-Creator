import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectStore } from '@/stores/projectStore'
import { Separator } from '@/components/ui/separator'
import { FileText, Info } from 'lucide-react'
import { formatDate } from 'shared/utils/format'
import { PROJECT_STATUS_LABELS } from 'shared/document-model/types'

export function EditorRightPanel() {
  const document = useProjectStore((s) => s.document)

  if (!document) {
    return (
      <div className="h-full border-l border-border bg-sidebar flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">No document loaded</p>
      </div>
    )
  }

  return (
    <div className="h-full border-l border-border bg-sidebar">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Properties
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <PropertyRow label="Status" value={PROJECT_STATUS_LABELS[document.metadata.status]} />
            <PropertyRow label="Author" value={document.metadata.author || '—'} />
            <PropertyRow label="Organization" value={document.metadata.organization || '—'} />
            <PropertyRow label="Page size" value={document.pageSettings.pageSize} />
            <PropertyRow label="Effective date" value={formatDate(document.metadata.effectiveDate)} />
            <PropertyRow label="Language" value={document.metadata.language} />
            <PropertyRow label="Sections" value={String(document.sections.length)} />
            <PropertyRow label="Variables" value={String(document.variables.length)} />
            <PropertyRow label="Rules" value={String(document.rules.length)} />
          </div>

          <Separator />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Select a block to see its properties</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right truncate max-w-[120px]">{value}</span>
    </div>
  )
}
