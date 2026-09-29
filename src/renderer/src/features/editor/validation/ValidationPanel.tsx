import * as React from 'react'
import { useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore } from '@/stores/uiStore'
import { validateDocument } from 'shared/validation-engine'
import type { ValidationResult } from 'shared/validation-engine'
import { cn } from '@/lib/utils'

const CODE_LABELS: Record<string, string> = {
  missing_required: 'Missing required content',
  unresolved_placeholder: 'Unresolved placeholder',
  circular_dependency: 'Circular dependency',
  invalid_formula: 'Invalid formula',
  duplicate_variable_key: 'Duplicate variable key',
}

function ResultItem({ result }: { result: ValidationResult }) {
  const { setActiveBlockId, setActiveSectionId, setActivePanel } = useUiStore()
  const document = useProjectStore((s) => s.document)

  function focusTarget() {
    if (result.targetType === 'block') {
      setActiveBlockId(result.targetId)
      setActivePanel('properties')
    } else if (result.targetType === 'section') {
      setActiveSectionId(result.targetId)
      setActivePanel('properties')
    } else if (result.targetType === 'variable') {
      setActivePanel('variables')
    }
  }

  return (
    <button
      className={cn(
        'w-full text-left rounded px-2 py-1.5 flex items-start gap-2 transition-colors',
        'hover:bg-secondary/60',
      )}
      onClick={focusTarget}
    >
      {result.severity === 'error' ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-500" />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-foreground leading-snug">
          {CODE_LABELS[result.code] ?? result.code}
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 break-words">
          {result.message}
        </p>
        {result.targetType !== 'document' && (
          <p className="text-[9px] text-primary/60 mt-0.5 hover:text-primary">Click to focus →</p>
        )}
      </div>
    </button>
  )
}

export function ValidationPanel() {
  const document = useProjectStore((s) => s.document)
  const [results, setResults] = useState<ValidationResult[] | null>(null)
  const [ran, setRan] = useState(false)

  function runValidation() {
    if (!document) return
    setResults(validateDocument(document))
    setRan(true)
  }

  const errors = results?.filter((r) => r.severity === 'error') ?? []
  const warnings = results?.filter((r) => r.severity === 'warning') ?? []

  if (!document) {
    return <p className="text-xs text-muted-foreground">No document loaded</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Validation
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6"
          onClick={runValidation}
          title="Run validation"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!ran ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <CheckSquare className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-xs text-muted-foreground">Run validation to check your document</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 h-7 text-xs gap-1"
            onClick={runValidation}
          >
            <RefreshCw className="h-3 w-3" />
            Run now
          </Button>
        </div>
      ) : results!.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
          <p className="text-xs font-medium text-green-500">All checks passed</p>
          <p className="text-[10px] text-muted-foreground/60">No errors or warnings found</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] gap-1 mt-1"
            onClick={runValidation}
          >
            <RefreshCw className="h-2.5 w-2.5" /> Re-run
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Summary bar */}
          <div className="flex items-center gap-3 px-1 pb-1">
            {errors.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-5 text-[10px] gap-1 px-1.5"
              onClick={runValidation}
            >
              <RefreshCw className="h-2.5 w-2.5" /> Re-run
            </Button>
          </div>

          {/* Errors first */}
          {errors.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 px-2 pt-1">Errors</p>
              {errors.map((r) => <ResultItem key={r.id} result={r} />)}
            </div>
          )}

          {/* Then warnings */}
          {warnings.length > 0 && (
            <div className="space-y-0.5 mt-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 px-2 pt-1">Warnings</p>
              {warnings.map((r) => <ResultItem key={r.id} result={r} />)}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-2 rounded bg-red-500/10 border border-red-500/20 px-2 py-1.5">
              <p className="text-[10px] text-red-400 font-medium">
                Export blocked — fix all errors first
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
