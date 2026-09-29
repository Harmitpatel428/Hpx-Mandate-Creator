import * as React from 'react'
import {
  FileText,
  Variable,
  GitBranch,
  CheckSquare,
  Clock,
  Settings,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import type { DocumentStatus } from 'shared/document-model/types'
import { useProjectStore } from '@/stores/projectStore'
import { VariablesPanel } from './variables/VariablesPanel'
import { LogicPanel } from './logic/LogicPanel'
import { ValidationPanel } from './validation/ValidationPanel'
import { VersionHistoryPanel } from './VersionHistoryPanel'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', colorMap[status ?? 'draft'])} />
  )
}

interface SortableSectionItemProps {
  id: string
  index: number
  title: string
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

function SortableSectionItem({ id, index, title, isActive, onClick, onDelete }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        'group/sec flex items-center gap-1 rounded py-1 px-1 cursor-pointer transition-colors',
        isActive ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground/70 hover:text-foreground',
      )}
      onClick={onClick}
    >
      <button
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0 w-4">{index + 1}.</span>
      <span className="flex-1 text-xs truncate">{title || 'Untitled section'}</span>
      <button
        className="opacity-0 group-hover/sec:opacity-100 shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

export function EditorLeftSidebar() {
  const { activePanel, setActivePanel, activeSectionId, setActiveSectionId, setActiveBlockId } = useUiStore()
  const document = useProjectStore((s) => s.document)
  const { removeSection, reorderSections } = useProjectStore()
  const sections = document?.sections ?? []

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = sections.map((s) => s.id)
    const oldIdx = ids.indexOf(active.id as string)
    const newIdx = ids.indexOf(over.id as string)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = [...ids]
    reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, active.id as string)
    reorderSections(reordered)
  }

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

          {/* Properties panel */}
          {activePanel === 'properties' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 py-1">
                  <StatusPip status={document?.metadata.status} />
                  <span className="text-xs text-foreground/80 truncate" title={document?.metadata.title}>
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
                <p className="text-xs text-muted-foreground/60 italic">No sections yet</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                      {sections.map((s, i) => (
                        <SortableSectionItem
                          key={s.id}
                          id={s.id}
                          index={i}
                          title={s.title}
                          isActive={activeSectionId === s.id}
                          onClick={() => { setActiveSectionId(s.id); setActiveBlockId(null) }}
                          onDelete={() => removeSection(s.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* Variables panel */}
          {activePanel === 'variables' && <VariablesPanel />}

          {/* Logic panel */}
          {activePanel === 'logic' && <LogicPanel />}

          {/* Validation panel */}
          {activePanel === 'validation' && <ValidationPanel />}

          {/* Versions panel */}
          {activePanel === 'versions' && <VersionHistoryPanel />}

          {/* Future panels */}
          {activePanel !== 'properties' &&
            activePanel !== 'variables' &&
            activePanel !== 'logic' &&
            activePanel !== 'validation' &&
            activePanel !== 'versions' && (
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
