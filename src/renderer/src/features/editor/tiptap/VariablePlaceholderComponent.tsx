import * as React from 'react'
import { NodeViewWrapper } from '@tiptap/react'

interface Props {
  node: {
    attrs: {
      key: string
      label?: string
    }
  }
  selected: boolean
}

export function VariablePlaceholderComponent({ node, selected }: Props) {
  const { key, label } = node.attrs
  const displayText = label || key

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex"
      contentEditable={false}
      style={{ userSelect: 'none' }}
    >
      <span
        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-mono font-medium transition-colors
          ${selected
            ? 'bg-primary text-primary-foreground ring-1 ring-primary'
            : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
          }`}
        title={`Variable: {{${key}}}`}
      >
        <span className="opacity-60">{'{'}</span>
        {displayText}
        <span className="opacity-60">{'}'}</span>
      </span>
    </NodeViewWrapper>
  )
}
