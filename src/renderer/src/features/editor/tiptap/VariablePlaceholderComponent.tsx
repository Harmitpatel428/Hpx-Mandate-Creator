import * as React from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function VariablePlaceholderComponent({ node, selected }: NodeViewProps) {
  const key = (node.attrs.key as string | null) ?? ''
  const label = node.attrs.label as string | undefined
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
