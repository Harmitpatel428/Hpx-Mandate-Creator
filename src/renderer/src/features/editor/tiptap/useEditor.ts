import { useCallback, useRef } from 'react'
import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { VariablePlaceholderNode } from './VariablePlaceholderNode'

interface UseEditorOptions {
  content: unknown
  placeholder?: string
  onBlurUpdate: (json: unknown) => void
  editable?: boolean
}

export function useDocEditor({ content, placeholder, onBlurUpdate, editable = true }: UseEditorOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useTiptapEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing…',
        emptyEditorClass: 'is-editor-empty',
      }),
      VariablePlaceholderNode,
    ],
    content: (content as object) ?? '',
    editable,
    editorProps: {
      attributes: {
        class: 'doc-editor focus:outline-none',
        spellcheck: 'true',
      },
    },
    onBlur: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onBlurUpdate(editor.getJSON())
    },
    onUpdate: ({ editor }) => {
      // Debounce 1200ms — DO NOT call on every keystroke
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onBlurUpdate(editor.getJSON())
      }, 1200)
    },
  })

  const insertVariable = useCallback(
    (key: string, label?: string) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .insertContent({ type: 'variablePlaceholder', attrs: { key, label: label || key } })
        .run()
    },
    [editor],
  )

  return { editor, insertVariable }
}
