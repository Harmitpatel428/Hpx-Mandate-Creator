import * as React from 'react'
import { useState } from 'react'
import type { Variable } from 'shared/document-model/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { coerceVariableValue, valueToInputString, inputTypeFor } from '@/lib/variable-values'

const VARIABLE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: '₹ Currency' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'party', label: 'Party reference' },
  { value: 'calculated', label: 'Calculated (formula)' },
]

interface Props {
  initial?: Variable
  onSave: (data: Omit<Variable, 'id'>) => void
  onCancel: () => void
}

export function VariableForm({ initial, onSave, onCancel }: Props) {
  const [key, setKey] = useState(initial?.key ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [type, setType] = useState<Variable['type']>(initial?.type ?? 'text')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [required, setRequired] = useState(initial?.required ?? false)
  const [optionsRaw, setOptionsRaw] = useState((initial?.options ?? []).join('\n'))
  const [formula, setFormula] = useState(initial?.formula ?? '')
  const [defaultText, setDefaultText] = useState(
    initial?.type !== 'boolean' ? valueToInputString(initial?.defaultValue) : '',
  )
  const [defaultBool, setDefaultBool] = useState(
    initial?.type === 'boolean' ? initial?.defaultValue === true : false,
  )
  const [error, setError] = useState('')

  const options = optionsRaw.split('\n').map((s) => s.trim()).filter(Boolean)

  function computeDefault(): unknown {
    if (type === 'calculated') return null
    if (type === 'boolean') return defaultBool
    return coerceVariableValue(defaultText, type)
  }

  function handleSave() {
    const trimKey = key.trim()
    if (!trimKey) { setError('Key is required'); return }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimKey)) {
      setError('Key must start with a letter or underscore and contain only letters, digits, underscores')
      return
    }
    const trimLabel = label.trim() || trimKey
    setError('')
    onSave({
      key: trimKey,
      label: trimLabel,
      type,
      description: description.trim(),
      required,
      defaultValue: computeDefault(),
      options: type === 'select' ? options : undefined,
      formula: type === 'calculated' ? formula.trim() : undefined,
    })
  }

  return (
    <div className="space-y-3 px-1">
      {error && <p className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">{error}</p>}

      <div className="space-y-1">
        <Label className="text-xs">Key <span className="text-destructive">*</span></Label>
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value.replace(/\s/g, '_'))}
          placeholder="client_name"
          className="h-8 text-xs font-mono"
          autoFocus
        />
        <p className="text-[10px] text-muted-foreground">Used as <code className="text-primary">{`{{${key || 'key'}}}`}</code> in the document</p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Display label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Client Name"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as Variable['type'])}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VARIABLE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === 'select' && (
        <div className="space-y-1">
          <Label className="text-xs">Options (one per line)</Label>
          <Textarea
            value={optionsRaw}
            onChange={(e) => setOptionsRaw(e.target.value)}
            className="text-xs min-h-[80px]"
            placeholder={'Option A\nOption B\nOption C'}
          />
        </div>
      )}

      {type === 'calculated' && (
        <div className="space-y-1">
          <Label className="text-xs">Formula</Label>
          <Input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="amount * 0.18"
            className="h-8 text-xs font-mono"
          />
        </div>
      )}

      {type !== 'calculated' && (
        <div className="space-y-1">
          <Label className="text-xs">Default value</Label>
          {type === 'boolean' ? (
            <div className="flex items-center gap-2">
              <Switch checked={defaultBool} onCheckedChange={setDefaultBool} />
              <span className="text-xs text-muted-foreground">{defaultBool ? 'Yes' : 'No'}</span>
            </div>
          ) : type === 'select' ? (
            <Select value={defaultText || undefined} onValueChange={setDefaultText}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose an option" /></SelectTrigger>
              <SelectContent>
                {options.length === 0 ? (
                  <SelectItem value="__none" disabled className="text-xs">Add options above first</SelectItem>
                ) : (
                  options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={inputTypeFor(type)}
              value={defaultText}
              onChange={(e) => setDefaultText(e.target.value)}
              placeholder={type === 'currency' ? '0' : 'Optional default'}
              className="h-8 text-xs"
            />
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-xs min-h-[48px] resize-none"
          placeholder="Optional hint for editors"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={required} onCheckedChange={setRequired} />
        <Label className="text-xs cursor-pointer" onClick={() => setRequired(!required)}>Required</Label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleSave}>
          {initial ? 'Update' : 'Add'} variable
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
