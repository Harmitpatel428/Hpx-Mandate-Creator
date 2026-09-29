import { describe, it, expect } from 'vitest'
import { evaluateCondition, evaluateConditionGroup } from '../../shared/logic-engine/evaluator'
import type { ConditionSchema, ConditionGroupSchema } from '../../shared/document-model/schema'
import { z } from 'zod'

type Condition = z.infer<typeof ConditionSchema>
type ConditionGroup = z.infer<typeof ConditionGroupSchema>

function cond(
  variableKey: string,
  operator: Condition['operator'],
  value: unknown = null,
): Condition {
  return { id: 'test', variableKey, operator, value }
}

function group(
  logic: 'AND' | 'OR',
  conditions: Condition[],
): ConditionGroup {
  return { id: 'grp', logic, conditions }
}

describe('evaluateCondition', () => {
  it('equals: string match', () => {
    expect(evaluateCondition(cond('x', 'equals', 'hello'), { x: 'hello' })).toBe(true)
    expect(evaluateCondition(cond('x', 'equals', 'hello'), { x: 'world' })).toBe(false)
  })

  it('equals: numeric coercion', () => {
    expect(evaluateCondition(cond('x', 'equals', '42'), { x: 42 })).toBe(true)
    expect(evaluateCondition(cond('x', 'equals', '0'), { x: 0 })).toBe(true)
  })

  it('not_equals', () => {
    expect(evaluateCondition(cond('x', 'not_equals', 'a'), { x: 'b' })).toBe(true)
    expect(evaluateCondition(cond('x', 'not_equals', 'a'), { x: 'a' })).toBe(false)
  })

  it('greater_than / less_than', () => {
    expect(evaluateCondition(cond('x', 'greater_than', 10), { x: 20 })).toBe(true)
    expect(evaluateCondition(cond('x', 'greater_than', 10), { x: 5 })).toBe(false)
    expect(evaluateCondition(cond('x', 'less_than', 10), { x: 5 })).toBe(true)
    expect(evaluateCondition(cond('x', 'less_than', 10), { x: 15 })).toBe(false)
  })

  it('contains: string substring', () => {
    expect(evaluateCondition(cond('x', 'contains', 'foo'), { x: 'foobar' })).toBe(true)
    expect(evaluateCondition(cond('x', 'contains', 'FOO'), { x: 'foobar' })).toBe(true) // case-insensitive
    expect(evaluateCondition(cond('x', 'contains', 'baz'), { x: 'foobar' })).toBe(false)
  })

  it('contains: array membership', () => {
    expect(evaluateCondition(cond('x', 'contains', 'b'), { x: ['a', 'b', 'c'] })).toBe(true)
    expect(evaluateCondition(cond('x', 'contains', 'd'), { x: ['a', 'b', 'c'] })).toBe(false)
  })

  it('is_empty / is_not_empty', () => {
    expect(evaluateCondition(cond('x', 'is_empty'), { x: '' })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_empty'), { x: null })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_empty'), { x: undefined })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_empty'), { x: 'hello' })).toBe(false)
    expect(evaluateCondition(cond('x', 'is_not_empty'), { x: 'hello' })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_not_empty'), { x: '' })).toBe(false)
  })

  it('is_true / is_false', () => {
    expect(evaluateCondition(cond('x', 'is_true'), { x: true })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_true'), { x: 'true' })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_true'), { x: false })).toBe(false)
    expect(evaluateCondition(cond('x', 'is_false'), { x: false })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_false'), { x: 'false' })).toBe(true)
    expect(evaluateCondition(cond('x', 'is_false'), { x: true })).toBe(false)
  })

  it('missing variable key: is_empty returns true, undefined !== null for equals', () => {
    // undefined is "empty"
    expect(evaluateCondition(cond('missing', 'is_empty'), {})).toBe(true)
    // undefined !== null, so equals(null) returns false
    expect(evaluateCondition(cond('missing', 'equals', null), {})).toBe(false)
    // is_not_empty: undefined is empty, so false
    expect(evaluateCondition(cond('missing', 'is_not_empty'), {})).toBe(false)
  })
})

describe('evaluateConditionGroup', () => {
  it('empty group is always true', () => {
    expect(evaluateConditionGroup(group('AND', []), {})).toBe(true)
    expect(evaluateConditionGroup(group('OR', []), {})).toBe(true)
  })

  it('AND: all conditions must pass', () => {
    const conditions = [
      cond('a', 'equals', 'yes'),
      cond('b', 'greater_than', 5),
    ]
    expect(evaluateConditionGroup(group('AND', conditions), { a: 'yes', b: 10 })).toBe(true)
    expect(evaluateConditionGroup(group('AND', conditions), { a: 'yes', b: 3 })).toBe(false)
    expect(evaluateConditionGroup(group('AND', conditions), { a: 'no', b: 10 })).toBe(false)
  })

  it('OR: any condition must pass', () => {
    const conditions = [
      cond('a', 'equals', 'yes'),
      cond('b', 'greater_than', 5),
    ]
    expect(evaluateConditionGroup(group('OR', conditions), { a: 'yes', b: 0 })).toBe(true)
    expect(evaluateConditionGroup(group('OR', conditions), { a: 'no', b: 10 })).toBe(true)
    expect(evaluateConditionGroup(group('OR', conditions), { a: 'no', b: 0 })).toBe(false)
  })
})
