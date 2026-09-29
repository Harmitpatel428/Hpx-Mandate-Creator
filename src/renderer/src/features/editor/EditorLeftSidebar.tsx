import * as React from 'react'
import {
  FileText,
  Variable,
  GitBranch,
  CheckSquare,
  Clock,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/uiStore'
import type { DocumentStatus } from 'shared/document-model/types'
import { useProjectStore } from '@/stores/projectStore'

type Panel = 'properties' | 'variables' | 'logic' | 'validation' | 'versions' | 'settings'

const NAV_ITEMS: { id: Panel; icon: React.ElementType; label: string }[] = [
  { id: 'properties', icon: FileText, label: 'Document' },
  { id: 'variables', icon: Variable, label: 'Variables' },
  { id: 'logic', icon: GitBranch, label: 'Logic' },
  { id: 'validation', icon: CheckSquare, label: 'Validation' },
  { id: 'versions', icon: Clock, label: 'Versions' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

function StatusPip({ status }: { status?: DocumentStatus }) {
  const colorMap: Record<DocumentStatus, string> = {
    draft: 'bg-muted-foreground/50',
    needs_review: 'bg-yellow-500',
    ready_to_export: 'bg-blue-500',
    final: 'bg-green-500',
    archived: 'bg-muted-foreground/30',
  }
  return (
    <span
      className={cn('h-1.5 w-1.5 rounded-full', colorMap[status ?? 'draft'])}
    />
  )
}

export function EditorLeftSidebar() {
  const { activePanel, setActivePanel } = useUiStore()
  const document = useProjectStore((s) => s.document)
  const sections = document?.sections ?? []

  return (
    <div className="flex h-full border-r border-border bg-sidebar">
      {/* Icon rail */}
      <div className="flex w-12 flex-col items-center border-r border-sidebar-border py-3 gap-1">
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActivePanel(item.id)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  activePanel === item.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1 w-44">
        <div className="p-3">
          {activePanel === 'properties' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Document
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 py-1">
                  <StatusPip status={document?.metadata.status} />
                  <span className="text-xs text-foreground/80 truncate">
                    {document?.metadata.title ?? 'Untitled'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {document?.metadata.author || 'No author'}
                </p>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sections ({sections.length})
              </p>
              {sections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No sections yet</p>
              ) : (
                <div className="space-y-0.5">
                  {sections.map((s, i) => (
                    <div
                      key={s.id}
                      className="text-xs text-foreground/70 py-1 px-2 rounded hover:bg-secondary cursor-pointer truncate"
                    >
                      {i + 1}. {s.title || 'Untitled section'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePanel !== 'properties' && (
            <div className="flex flex-col items-center justify-center gap-2 pt-8 text-center">
              <p className="text-xs text-muted-foreground">
                {NAV_ITEMS.find((n) => n.id === activePanel)?.label} panel
              </p>
              <p className="text-xs text-muted-foreground/60">Available in a future phase</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
