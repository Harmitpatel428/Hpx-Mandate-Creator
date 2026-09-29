import * as React from 'react'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Variable } from 'shared/document-model/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  variable: Variable
  usageCount: number
  onEdit: () => void
  onDelete: () => void
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  'long-text': 'Long Text',
  number: 'Number',
  currency: '₹ Currency',
  date: 'Date',
  boolean: 'Boolean',
  select: 'Select',
  party: 'Party',
  list: 'List',
  calculated: 'Formula',
}

export function VariableRow({ variable, usageCount, onEdit, onDelete }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-2 transition-colors',
        hovered && 'bg-secondary/60',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Key + label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <code className="text-xs text-primary font-mono">{variable.key}</code>
          {variable.required && (
            <span className="text-[10px] text-destructive">*</span>
          )}
        </div>
        {variable.label !== variable.key && (
          <p className="text-xs text-muted-foreground/70 truncate">{variable.label}</p>
        )}
      </div>

      {/* Type badge */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {TYPE_LABELS[variable.type] || variable.type}
      </span>

      {/* Usage count */}
      <span
        className={cn(
          'text-[10px] shrink-0',
          usageCount > 0 ? 'text-blue-500' : 'text-muted-foreground/40',
        )}
        title={`Used ${usageCount} time${usageCount !== 1 ? 's' : ''} in document`}
      >
        {usageCount > 0 ? `×${usageCount}` : '—'}
      </span>

      {/* Actions */}
      <div className={cn('flex gap-0.5 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
