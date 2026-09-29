import * as React from 'react'
import { useState } from 'react'
import { Info, AlertTriangle, Lock } from 'lucide-react'
import type { NoteBlock as NoteBlockType } from 'shared/document-model/types'
import { useProjectStore } from '@/stores/projectStore'
import { cn } from '@/lib/utils'

interface Props {
  block: NoteBlockType
  sectionId: string
}

const noteConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800',
  },
  internal: {
    icon: Lock,
    bg: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-500',
    textColor: 'text-purple-800',
  },
}

export function NoteBlock({ block, sectionId }: Props) {
  const updateBlock = useProjectStore((s) => s.updateBlock)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(block.content)
  const config = noteConfig[block.noteType]
  const Icon = config.icon

  function commit() {
    setEditing(false)
    if (draft !== block.content) updateBlock(sectionId, block.id, { content: draft })
  }

  return (
    <div className={cn('flex gap-2 rounded-md border p-3', config.bg)}>
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.iconColor)} />
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          className={cn('flex-1 bg-transparent text-sm resize-none outline-none', config.textColor)}
          rows={3}
          autoFocus
        />
      ) : (
        <p
          className={cn('flex-1 text-sm cursor-text', config.textColor, !block.content && 'opacity-50 italic')}
          onDoubleClick={() => { setDraft(block.content); setEditing(true) }}
        >
          {block.content || 'Add note content…'}
        </p>
      )}
    </div>
  )
}
