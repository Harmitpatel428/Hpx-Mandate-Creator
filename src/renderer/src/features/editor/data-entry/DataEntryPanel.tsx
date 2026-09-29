import * as React from 'react'
import { useMemo } from 'react'
import { FormInput } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/projectStore'
import { resolveDocument } from 'shared/logic-engine/resolver'
import { formatVariableValue } from 'shared/document-model/render-utils'
import { coerceVariableValue, valueToInputString, inputTypeFor } from '@/lib/variable-values'
import type { Variable } from 'shared/document-model/types'

export function DataEntryPanel() {
  const document = useProjectStore((s) => s.document)
  const setVariableValue = useProjectStore((s) => s.setVariableValue)

  const variables = document?.variables ?? []
  const editable = variables.filter((v) => v.type !== 'calculated')
  const calculated = variables.filter((v) => v.type === 'calculated')

  const resolved = useMemo(() => (document ? resolveDocument(document) : null), [document])

  function currentValue(v: Variable): unknown {
    const val = document?.variableValues[v.key]
    return val !== undefined ? val : v.defaultValue
  }

  if (!document) return <p className="text-xs text-muted-foreground/60 italic">No document</p>

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 pt-6 text-center">
        <FormInput className="h-5 w-5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground/60">No variables yet</p>
        <p className="text-[10px] text-muted-foreground/50">Add variables, then fill their values here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Entry</p>

      <div className="space-y-3">
        {editable.map((v) => {
          const value = currentValue(v)
          return (
            <div key={v.id} className="space-y-1">
              <label className="text-xs font-medium text-foreground/80 flex items-center gap-1">
                {v.label}
                {v.required && <span className="text-destructive">*</span>}
                <span className="text-[10px] text-muted-foreground/50 font-mono">{`{{${v.key}}}`}</span>
              </label>

              {v.type === 'boolean' ? (
                <div className="flex items-center gap-2">
                  <Switch checked={value === true} onCheckedChange={(c) => setVariableValue(v.key, c)} />
                  <span className="text-xs text-muted-foreground">{value === true ? 'Yes' : 'No'}</span>
                </div>
              ) : v.type === 'select' ? (
                <Select value={valueToInputString(value) || undefined} onValueChange={(val) => setVariableValue(v.key, val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {(v.options ?? []).map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={inputTypeFor(v.type)}
                  value={valueToInputString(value)}
                  onChange={(e) => setVariableValue(v.key, coerceVariableValue(e.target.value, v.type))}
                  className="h-8 text-xs"
                  placeholder={v.type === 'currency' ? '₹ amount' : 'Enter value'}
                />
              )}
            </div>
          )
        })}
      </div>

      {calculated.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Calculated</p>
          {calculated.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground/70 truncate">{v.label}</span>
              <span className="font-mono text-muted-foreground">
                {resolved ? formatVariableValue(resolved.resolvedValues[v.key], v) || '—' : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
