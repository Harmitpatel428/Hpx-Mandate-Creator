import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import type { HeadingBlock as HeadingBlockType } from 'shared/document-model/types'
import { useProjectStore } from '@/stores/projectStore'
import { cn } from '@/lib/utils'

interface Props {
  block: HeadingBlockType
  sectionId: string
}

const levelClasses: Record<1 | 2 | 3, string> = {
  1: 'text-xl font-bold text-gray-900 leading-tight',
  2: 'text-base font-semibold text-gray-800 leading-snug',
  3: 'text-sm font-semibold text-gray-700 leading-snug',
}

export function HeadingBlock({ block, sectionId }: Props) {
  const updateBlock = useProjectStore((s) => s.updateBlock)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(block.content)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(block.content)
  }, [block.content])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft !== block.content) {
      updateBlock(sectionId, block.id, { content: draft })
    }
  }

  const level = block.level as 1 | 2 | 3

  return editing ? (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') commit()
      }}
      className={cn(
        'w-full bg-transparent outline-none border-b border-primary/60 pb-0.5',
        levelClasses[level],
      )}
      maxLength={300}
    />
  ) : (
    <p
      className={cn(
        'cursor-text select-text py-0.5',
        levelClasses[level],
        !block.content && 'text-gray-400 italic',
      )}
      onDoubleClick={() => setEditing(true)}
    >
      {block.content || `Heading ${level}`}
    </p>
  )
}
