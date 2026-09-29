import * as React from 'react'
import { useEffect, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { Braces, ChevronDown } from 'lucide-react'
import type { ParagraphBlock as ParagraphBlockType } from 'shared/document-model/types'
import { useDocEditor } from '../tiptap/useEditor'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorFocusStore } from '@/stores/editorFocusStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  block: ParagraphBlockType
  sectionId: string
}

export function ParagraphBlock({ block, sectionId }: Props) {
  const updateBlock = useProjectStore((s) => s.updateBlock)
  const variables = useProjectStore((s) => s.document?.variables ?? [])
  const setActiveInsert = useEditorFocusStore((s) => s.setActiveInsert)
  const clearActiveInsert = useEditorFocusStore((s) => s.clearActiveInsert)
  const [focused, setFocused] = useState(false)

  const { editor, insertVariable } = useDocEditor({
    content: block.content,
    placeholder: 'Write something…',
    onBlurUpdate: (json) => {
      updateBlock(sectionId, block.id, { content: json })
    },
  })

  // Register this editor as the insert target while it is (or was last) focused.
  useEffect(() => {
    if (!editor) return
    const onFocus = () => { setFocused(true); setActiveInsert(block.id, insertVariable) }
    const onBlur = () => setFocused(false)
    editor.on('focus', onFocus)
    editor.on('blur', onBlur)
    return () => {
      editor.off('focus', onFocus)
      editor.off('blur', onBlur)
      clearActiveInsert(block.id)
    }
  }, [editor, insertVariable, block.id, setActiveInsert, clearActiveInsert])

  return (
    <div className="paragraph-block py-0.5 group/para relative">
      <div
        className={`absolute -top-3 right-0 z-10 transition-opacity ${focused ? 'opacity-100' : 'opacity-0 group-hover/para:opacity-100'}`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary shadow-sm"
              onMouseDown={(e) => e.preventDefault()}
              title="Insert variable"
            >
              <Braces className="h-3 w-3" />
              Variable
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
            {variables.length === 0 ? (
              <DropdownMenuItem disabled className="text-xs">No variables defined</DropdownMenuItem>
            ) : (
              variables.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  className="text-xs"
                  onSelect={() => insertVariable(v.key, v.label)}
                >
                  <span className="font-mono text-primary mr-1.5">{`{{${v.key}}}`}</span>
                  <span className="text-muted-foreground truncate">{v.label}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none text-gray-700 [&_.is-editor-empty]:before:text-gray-400 [&_.is-editor-empty]:before:italic [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:h-0"
      />
    </div>
  )
}
