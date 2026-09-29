import * as React from 'react'
import { EditorContent } from '@tiptap/react'
import type { ParagraphBlock as ParagraphBlockType } from 'shared/document-model/types'
import { useDocEditor } from '../tiptap/useEditor'
import { useProjectStore } from '@/stores/projectStore'

interface Props {
  block: ParagraphBlockType
  sectionId: string
}

export function ParagraphBlock({ block, sectionId }: Props) {
  const updateBlock = useProjectStore((s) => s.updateBlock)

  const { editor } = useDocEditor({
    content: block.content,
    placeholder: 'Write something…',
    onBlurUpdate: (json) => {
      updateBlock(sectionId, block.id, { content: json })
    },
  })

  return (
    <div className="paragraph-block py-0.5">
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none text-gray-700 [&_.is-editor-empty]:before:text-gray-400 [&_.is-editor-empty]:before:italic [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:h-0"
      />
    </div>
  )
}
