import * as React from 'react'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Block } from 'shared/document-model/types'

interface BlockWrapperProps {
  block: Block
  sectionId: string
  children: React.ReactNode
  isLocked?: boolean
}

export function BlockWrapper({ block, sectionId, children, isLocked }: BlockWrapperProps) {
  const { activeBlockId, setActiveBlockId } = useUiStore()
  const { removeBlock } = useProjectStore()
  const [hovered, setHovered] = useState(false)
  const isActive = activeBlockId === block.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: isLocked })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/block relative rounded transition-all duration-100',
        isActive && 'ring-1 ring-primary/40',
        isDragging && 'z-50',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); setActiveBlockId(block.id) }}
    >
      {/* Drag handle + actions - shown on hover */}
      {!isLocked && (
        <div
          className={cn(
            'absolute -left-8 top-1 flex flex-col gap-0.5 transition-opacity',
            hovered || isActive ? 'opacity-100' : 'opacity-0',
          )}
        >
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Delete action */}
      {!isLocked && (hovered || isActive) && (
        <div className="absolute -right-8 top-1 flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-5 w-5 text-muted-foreground/60 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              removeBlock(sectionId, block.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {children}
    </div>
  )
}
