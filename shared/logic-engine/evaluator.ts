import type { ConditionSchema, ConditionGroupSchema } from '../document-model/schema'
import { z } from 'zod'

type Condition = z.infer<typeof ConditionSchema>
type ConditionGroup = z.infer<typeof ConditionGroupSchema>

function coerce(a: unknown, b: unknown): [unknown, unknown] {
  if (typeof a === 'string' && typeof b === 'string') return [a, b]
  const na = Number(a)
  const nb = Number(b)
  if (!isNaN(na) && !isNaN(nb)) return [na, nb]
  return [a, b]
}

export function evaluateCondition(
  condition: Condition,
  values: Record<string, unknown>,
): boolean {
  const raw = values[condition.variableKey]

  switch (condition.operator) {
    case 'is_empty':
      return raw === null || raw === undefined || raw === '' || raw === false
    case 'is_not_empty':
      return raw !== null && raw !== undefined && raw !== '' && raw !== false
    case 'is_true':
      return raw === true || raw === 'true' || raw === 1 || raw === '1'
    case 'is_false':
      return raw === false || raw === 'false' || raw === 0 || raw === '0'
    case 'equals': {
      const [a, b] = coerce(raw, condition.value)
      return a === b
    }
    case 'not_equals': {
      const [a, b] = coerce(raw, condition.value)
      return a !== b
    }
    case 'greater_than': {
      const [a, b] = coerce(raw, condition.value)
      return Number(a) > Number(b)
    }
    case 'less_than': {
      const [a, b] = coerce(raw, condition.value)
      return Number(a) < Number(b)
    }
    case 'contains': {
      if (typeof raw === 'string') {
        return raw.toLowerCase().includes(String(condition.value).toLowerCase())
      }
      if (Array.isArray(raw)) {
        return raw.includes(condition.value)
      }
      return false
    }
    default:
      return false
  }
}

export function evaluateConditionGroup(
  group: ConditionGroup,
  values: Record<string, unknown>,
): boolean {
  if (group.conditions.length === 0) return true

  if (group.logic === 'AND') {
    return group.conditions.every((c) => evaluateCondition(c, values))
  } else {
    return group.conditions.some((c) => evaluateCondition(c, values))
  }
}

export function conditionGroupToEnglish(group: ConditionGroup): string {
  if (group.conditions.length === 0) return 'Always'
  const parts = group.conditions.map((c) => conditionToEnglish(c))
  return parts.join(` ${group.logic} `)
}

function conditionToEnglish(c: Condition): string {
  const key = c.variableKey || '?'
  switch (c.operator) {
    case 'is_empty': return `${key} is empty`
    case 'is_not_empty': return `${key} is not empty`
    case 'is_true': return `${key} is true`
    case 'is_false': return `${key} is false`
    case 'equals': return `${key} = ${c.value}`
    case 'not_equals': return `${key} ≠ ${c.value}`
    case 'greater_than': return `${key} > ${c.value}`
    case 'less_than': return `${key} < ${c.value}`
    case 'contains': return `${key} contains "${c.value}"`
    default: return `${key} ?`
  }
}
