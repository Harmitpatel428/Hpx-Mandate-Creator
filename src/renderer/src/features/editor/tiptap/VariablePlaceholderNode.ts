import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VariablePlaceholderComponent } from './VariablePlaceholderComponent'

export const VariablePlaceholderNode = Node.create({
  name: 'variablePlaceholder',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-key'),
        renderHTML: (attrs) => ({ 'data-key': attrs.key }),
      },
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-label'),
        renderHTML: (attrs) => (attrs.label ? { 'data-label': attrs.label } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-variable-placeholder]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-variable-placeholder': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariablePlaceholderComponent)
  },
})
