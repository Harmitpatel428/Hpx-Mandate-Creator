import * as React from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/stores/projectStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AutosaveIndicator() {
  const saveState = useProjectStore((s) => s.saveState)

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-colors duration-200',
        saveState === 'saved' && 'text-muted-foreground',
        saveState === 'saving' && 'text-muted-foreground',
        saveState === 'unsaved' && 'text-yellow-500/80',
        saveState === 'error' && 'text-destructive',
      )}
    >
      {saveState === 'saved' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {saveState === 'saving' && <LoadingSpinner size="sm" className="h-3.5 w-3.5" />}
      {saveState === 'unsaved' && <Circle className="h-3.5 w-3.5 fill-current" />}
      {saveState === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {saveState === 'saved' && 'Saved'}
        {saveState === 'saving' && 'Saving…'}
        {saveState === 'unsaved' && 'Unsaved'}
        {saveState === 'error' && 'Save failed'}
      </span>
    </div>
  )
}
