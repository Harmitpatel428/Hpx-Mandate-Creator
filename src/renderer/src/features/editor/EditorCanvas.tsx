import * as React from 'react'
import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore } from '@/stores/uiStore'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BlockWrapper } from './blocks/BlockWrapper'
import { SaveClauseModal, type ClausePayload } from '../library/SaveClauseModal'
import { Bookmark } from 'lucide-react'
import { HeadingBlock } from './blocks/HeadingBlock'
import { ParagraphBlock } from './blocks/ParagraphBlock'
import { PageBreakBlock } from './blocks/PageBreakBlock'
import { NoteBlock } from './blocks/NoteBlock'
import { SignatureBlock } from './blocks/SignatureBlock'
import { TableBlock } from './blocks/TableBlock'
import type { Block, Section } from 'shared/document-model/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const BLOCK_TYPES: { type: Block['type']; label: string }[] = [
  { type: 'heading', label: 'Heading' },
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'note', label: 'Note' },
  { type: 'table', label: 'Table' },
  { type: 'signature', label: 'Signature Block' },
  { type: 'page-break', label: 'Page Break' },
]

function BlockRenderer({ block, sectionId }: { block: Block; sectionId: string }) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock block={block} sectionId={sectionId} />
    case 'paragraph':
      return <ParagraphBlock block={block} sectionId={sectionId} />
    case 'page-break':
      return <PageBreakBlock />
    case 'note':
      return <NoteBlock block={block} sectionId={sectionId} />
    case 'signature':
      return <SignatureBlock block={block} />
    case 'table':
      return <TableBlock block={block} sectionId={sectionId} />
    default:
      return (
        <div className="rounded border border-dashed border-gray-200 p-3 text-xs text-gray-400 italic">
          {block.type} block (editor coming in a later phase)
        </div>
      )
  }
}

function SectionView({
  section,
  sectionIndex,
  onSaveAsClause,
}: {
  section: Section
  sectionIndex: number
  onSaveAsClause: (payload: ClausePayload) => void
}) {
  const { addBlock, reorderBlocks, updateSection } = useProjectStore()
  const { setActiveSectionId, setActiveBlockId } = useUiStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = section.blocks.map((b) => b.id)
    const oldIdx = ids.indexOf(active.id as string)
    const newIdx = ids.indexOf(over.id as string)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = [...ids]
    reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, active.id as string)
    reorderBlocks(section.id, reordered)
  }

  function commitTitle() {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (trimmed !== section.title) {
      updateSection(section.id, { title: trimmed })
    }
  }

  return (
    <div
      className="group/section"
      onClick={() => { setActiveSectionId(section.id); setActiveBlockId(null) }}
    >
      {/* Section header */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xs font-mono text-gray-400 w-5 shrink-0">{sectionIndex + 1}.</span>
        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') commitTitle()
            }}
            className="flex-1 bg-transparent text-base font-semibold text-gray-800 outline-none border-b border-primary/60 pb-0.5"
            maxLength={300}
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-base font-semibold text-gray-800 cursor-text"
            onDoubleClick={() => { setTitleDraft(section.title); setEditingTitle(true) }}
          >
            {section.title || <span className="text-gray-400 font-normal italic text-sm">Untitled Section</span>}
          </h2>
        )}
        {section.blocks.length > 0 && (
          <button
            className="opacity-0 group-hover/section:opacity-100 shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-primary hover:bg-gray-100 transition-all"
            title="Save section as clause"
            onClick={(e) => { e.stopPropagation(); onSaveAsClause({ kind: 'section', section }) }}
          >
            <Bookmark className="h-3 w-3" />
            Save as clause
          </button>
        )}
      </div>

      {/* Blocks */}
      <div className="ml-7 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={section.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {section.blocks.map((block) => (
              <BlockWrapper
                key={block.id}
                block={block}
                sectionId={section.id}
                isLocked={block.locked}
                onSaveAsClause={(b) => onSaveAsClause({ kind: 'blocks', blocks: [b] })}
              >
                <BlockRenderer block={block} sectionId={section.id} />
              </BlockWrapper>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add block */}
        <div className="pt-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Plus className="h-3 w-3" />
                Add block
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {BLOCK_TYPES.map((bt) => (
                <DropdownMenuItem
                  key={bt.type}
                  className="text-xs"
                  onClick={() => addBlock(section.id, bt.type)}
                >
                  {bt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function EditorCanvas() {
  const document = useProjectStore((s) => s.document)
  const { addSection } = useProjectStore()
  const [clausePayload, setClausePayload] = useState<ClausePayload | null>(null)

  const sections = document?.sections ?? []

  if (!document) {
    return (
      <ScrollArea className="h-full bg-[hsl(0,0%,5%)]">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No document loaded</p>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full bg-[hsl(0,0%,5%)]">
      <div className="flex flex-col items-center py-10 px-6 min-h-full">
        {/* A4 page simulation */}
        <div
          className="w-full max-w-2xl bg-white text-gray-900 shadow-xl rounded-sm"
          style={{ minHeight: '842px', padding: '64px 72px 80px' }}
        >
          {/* Document title */}
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {document.metadata.title || 'Untitled Mandate'}
            </h1>
            {document.metadata.description && (
              <p className="mt-2 text-sm text-gray-500">{document.metadata.description}</p>
            )}
            {document.metadata.author && (
              <p className="mt-1 text-xs text-gray-400">{document.metadata.author}</p>
            )}
          </div>

          {/* Sections */}
          {sections.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-gray-400">This document has no sections yet.</p>
              <button
                onClick={() => addSection()}
                className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add first section
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section, sIdx) => (
                <SectionView
                  key={section.id}
                  section={section}
                  sectionIndex={sIdx}
                  onSaveAsClause={setClausePayload}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add section button */}
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection()}
            className="gap-2 border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add section
          </Button>
        </div>
      </div>

      <SaveClauseModal
        open={!!clausePayload}
        onClose={() => setClausePayload(null)}
        payload={clausePayload}
      />
    </ScrollArea>
  )
}
