import * as React from 'react'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, GitBranch, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useProjectStore } from '@/stores/projectStore'
import { generateId } from 'shared/utils/id'
import { conditionGroupToEnglish } from 'shared/logic-engine/evaluator'
import type { LogicRule, Variable, Section } from 'shared/document-model/types'
import { cn } from '@/lib/utils'

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'contains', label: 'contains' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'is_true', label: 'is true' },
  { value: 'is_false', label: 'is false' },
] as const

const VALUE_FREE_OPS = ['is_empty', 'is_not_empty', 'is_true', 'is_false']

const ACTION_TYPES = [
  { value: 'show_block', label: 'Show block' },
  { value: 'hide_block', label: 'Hide block' },
  { value: 'show_section', label: 'Show section' },
  { value: 'hide_section', label: 'Hide section' },
  { value: 'set_variable', label: 'Set variable value' },
  { value: 'mark_required', label: 'Mark required' },
  { value: 'mark_optional', label: 'Mark optional' },
] as const

function makeDefaultRule(): LogicRule {
  return {
    id: generateId(),
    name: 'New Rule',
    description: '',
    enabled: true,
    priority: 0,
    conditionGroup: {
      id: generateId(),
      logic: 'AND',
      conditions: [{ id: generateId(), variableKey: '', operator: 'equals', value: '' }],
    },
    actions: [{ id: generateId(), type: 'show_block', targetId: '', value: null }],
  }
}

function actionSummary(
  action: LogicRule['actions'][number],
  sections: Section[],
): string {
  const blocks = sections.flatMap((s) => s.blocks)
  const block = blocks.find((b) => b.id === action.targetId)
  const section = sections.find((s) => s.id === action.targetId)
  const target = block
    ? `block "${(block as { content?: string }).content?.toString().slice(0, 20) || block.type}"`
    : section
    ? `section "${section.title || 'Untitled'}"`
    : action.targetId || '?'

  switch (action.type) {
    case 'show_block': return `Show ${target}`
    case 'hide_block': return `Hide ${target}`
    case 'show_section': return `Show ${target}`
    case 'hide_section': return `Hide ${target}`
    case 'set_variable': return `Set {{${action.targetId}}} = ${action.value}`
    case 'mark_required': return `Mark ${target} required`
    case 'mark_optional': return `Mark ${target} optional`
    default: return action.type
  }
}

interface RuleCardProps {
  rule: LogicRule
  variables: Variable[]
  sections: Section[]
}

function RuleCard({ rule, variables, sections }: RuleCardProps) {
  const { updateRule, removeRule } = useProjectStore()
  const [expanded, setExpanded] = useState(false)

  const conditionSummary = conditionGroupToEnglish(rule.conditionGroup)
  const actionsSummary = rule.actions.map((a) => actionSummary(a, sections)).join(', ')
  const allBlocks = sections.flatMap((s) => s.blocks)

  function patchRule(patch: Partial<LogicRule>) {
    updateRule(rule.id, patch)
  }

  function patchConditionGroup(patch: Partial<LogicRule['conditionGroup']>) {
    patchRule({ conditionGroup: { ...rule.conditionGroup, ...patch } })
  }

  function updateCondition(condId: string, patch: Partial<LogicRule['conditionGroup']['conditions'][number]>) {
    patchConditionGroup({
      conditions: rule.conditionGroup.conditions.map((c) =>
        c.id === condId ? { ...c, ...patch } : c,
      ),
    })
  }

  function addCondition() {
    patchConditionGroup({
      conditions: [
        ...rule.conditionGroup.conditions,
        { id: generateId(), variableKey: '', operator: 'equals' as const, value: '' },
      ],
    })
  }

  function removeCondition(condId: string) {
    patchConditionGroup({
      conditions: rule.conditionGroup.conditions.filter((c) => c.id !== condId),
    })
  }

  function updateAction(actId: string, patch: Partial<LogicRule['actions'][number]>) {
    patchRule({
      actions: rule.actions.map((a) => (a.id === actId ? { ...a, ...patch } : a)),
    })
  }

  function addAction() {
    patchRule({
      actions: [
        ...rule.actions,
        { id: generateId(), type: 'show_block' as const, targetId: '', value: null },
      ],
    })
  }

  function removeAction(actId: string) {
    patchRule({ actions: rule.actions.filter((a) => a.id !== actId) })
  }

  function getTargetOptions(actionType: string): { value: string; label: string }[] {
    if (actionType === 'set_variable' || actionType === 'mark_required' || actionType === 'mark_optional') {
      const blockTargets = allBlocks.map((b) => ({ value: b.id, label: `Block: ${b.type}` }))
      const sectionTargets = sections.map((s) => ({ value: s.id, label: `Section: ${s.title || 'Untitled'}` }))
      if (actionType === 'set_variable') {
        return variables.map((v) => ({ value: v.key, label: `{{${v.key}}}` }))
      }
      return [...blockTargets, ...sectionTargets]
    }
    if (actionType.includes('block')) {
      return allBlocks.map((b) => ({ value: b.id, label: `${b.type} block` }))
    }
    return sections.map((s) => ({ value: s.id, label: s.title || 'Untitled' }))
  }

  return (
    <div className={cn('rounded-md border border-border bg-background', !rule.enabled && 'opacity-60')}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Switch
          checked={rule.enabled}
          onCheckedChange={(v) => patchRule({ enabled: v })}
          className="scale-75"
        />
        <input
          value={rule.name}
          onChange={(e) => patchRule({ name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-xs font-medium outline-none text-foreground"
          placeholder="Rule name"
        />
        <button
          className="text-muted-foreground/50 hover:text-muted-foreground"
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          className="text-muted-foreground/50 hover:text-destructive"
          onClick={() => removeRule(rule.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Collapsed summary */}
      {!expanded && (
        <div className="px-3 pb-2 text-[10px] text-muted-foreground/60 leading-tight">
          <span className="text-blue-400">IF</span> {conditionSummary}{' '}
          <span className="text-green-400">THEN</span> {actionsSummary || '—'}
        </div>
      )}

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Condition group */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">IF</span>
              <Select
                value={rule.conditionGroup.logic}
                onValueChange={(v) => patchConditionGroup({ logic: v as 'AND' | 'OR' })}
              >
                <SelectTrigger className="h-5 w-14 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND" className="text-xs">AND</SelectItem>
                  <SelectItem value="OR" className="text-xs">OR</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">of these conditions:</span>
            </div>

            {rule.conditionGroup.conditions.map((cond) => (
              <div key={cond.id} className="flex items-center gap-1.5 flex-wrap">
                <Select
                  value={cond.variableKey}
                  onValueChange={(v) => updateCondition(cond.id, { variableKey: v })}
                >
                  <SelectTrigger className="h-6 w-24 text-[10px]">
                    <SelectValue placeholder="Variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {variables.map((v) => (
                      <SelectItem key={v.id} value={v.key} className="text-xs">
                        {`{{${v.key}}}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={cond.operator}
                  onValueChange={(v) => updateCondition(cond.id, { operator: v as typeof cond.operator })}
                >
                  <SelectTrigger className="h-6 w-24 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value} className="text-xs">
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!VALUE_FREE_OPS.includes(cond.operator) && (
                  <Input
                    value={String(cond.value ?? '')}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    className="h-6 w-20 text-[10px]"
                    placeholder="value"
                  />
                )}

                <button
                  className="text-muted-foreground/40 hover:text-destructive"
                  onClick={() => removeCondition(cond.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
              onClick={addCondition}
            >
              <Plus className="h-3 w-3" /> Add condition
            </button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">THEN</span>

            {rule.actions.map((action) => {
              const opts = getTargetOptions(action.type)
              return (
                <div key={action.id} className="flex items-center gap-1.5 flex-wrap">
                  <Select
                    value={action.type}
                    onValueChange={(v) => updateAction(action.id, { type: v as typeof action.type, targetId: '' })}
                  >
                    <SelectTrigger className="h-6 w-28 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((at) => (
                        <SelectItem key={at.value} value={at.value} className="text-xs">
                          {at.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={action.targetId}
                    onValueChange={(v) => updateAction(action.id, { targetId: v })}
                  >
                    <SelectTrigger className="h-6 w-28 text-[10px]">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {action.type === 'set_variable' && (
                    <Input
                      value={String(action.value ?? '')}
                      onChange={(e) => updateAction(action.id, { value: e.target.value })}
                      className="h-6 w-20 text-[10px]"
                      placeholder="value"
                    />
                  )}

                  <button
                    className="text-muted-foreground/40 hover:text-destructive"
                    onClick={() => removeAction(action.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })}

            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
              onClick={addAction}
            >
              <Plus className="h-3 w-3" /> Add action
            </button>
          </div>

          {/* Plain-English summary */}
          <div className="rounded bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-medium text-blue-400">IF</span> {conditionSummary}{' '}
            <span className="font-medium text-green-400">THEN</span>{' '}
            {rule.actions.map((a) => actionSummary(a, sections)).join(', ') || '—'}
          </div>
        </div>
      )}
    </div>
  )
}

export function LogicPanel() {
  const document = useProjectStore((s) => s.document)
  const { addRule } = useProjectStore()

  if (!document) {
    return <p className="text-xs text-muted-foreground">No document loaded</p>
  }

  const rules = document.rules ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Logic Rules
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6"
          onClick={() => addRule(makeDefaultRule())}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-xs text-muted-foreground">No rules yet</p>
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            Rules control block visibility, required fields, and variable values.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 h-7 text-xs gap-1"
            onClick={() => addRule(makeDefaultRule())}
          >
            <Plus className="h-3 w-3" />
            Add first rule
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              variables={document.variables}
              sections={document.sections}
            />
          ))}
        </div>
      )}
    </div>
  )
}
