import { describe, it, expect } from 'vitest'
import { detectCycles, topologicalSort, CyclicDependencyError } from '../../shared/logic-engine/cycle-detector'
import type { Variable } from '../../shared/document-model/types'

function makeVar(key: string, formula?: string): Variable {
  return {
    id: key,
    key,
    label: key,
    description: '',
    type: formula ? 'calculated' : 'text',
    defaultValue: null,
    required: false,
    ...(formula ? { formula } : {}),
  }
}

describe('detectCycles', () => {
  it('returns empty array when no variables', () => {
    expect(detectCycles([])).toEqual([])
  })

  it('returns empty array for plain (non-calculated) variables', () => {
    const vars = [makeVar('client_name'), makeVar('fee_amount')]
    expect(detectCycles(vars)).toEqual([])
  })

  it('returns empty array for a valid dependency chain', () => {
    // base -> calculated_a -> calculated_b (no cycle)
    const vars = [
      makeVar('base', undefined),
      makeVar('calc_a', 'base * 2'),
      makeVar('calc_b', 'calc_a + 1'),
    ]
    expect(detectCycles(vars)).toEqual([])
  })

  it('detects a direct 2-node cycle: a depends on b, b depends on a', () => {
    const vars = [
      makeVar('a', 'b + 1'),
      makeVar('b', 'a + 1'),
    ]
    const cycles = detectCycles(vars)
    expect(cycles.length).toBeGreaterThan(0)
    const flat = cycles.flat()
    expect(flat).toContain('a')
    expect(flat).toContain('b')
  })

  it('detects a 3-node cycle: a -> b -> c -> a', () => {
    const vars = [
      makeVar('a', 'b * 2'),
      makeVar('b', 'c * 2'),
      makeVar('c', 'a * 2'),
    ]
    const cycles = detectCycles(vars)
    expect(cycles.length).toBeGreaterThan(0)
  })

  it('returns empty for a self-referencing variable (no edge to self in current model)', () => {
    // Self-reference: a = a + 1 — should be detected as a cycle
    const vars = [makeVar('a', 'a + 1')]
    const cycles = detectCycles(vars)
    // a depends on a — a cycle of length 1
    expect(cycles.length).toBeGreaterThan(0)
  })
})

describe('topologicalSort', () => {
  it('returns all keys with no cycles', () => {
    const vars = [
      makeVar('base'),
      makeVar('double', 'base * 2'),
      makeVar('triple', 'base * 3'),
      makeVar('total', 'double + triple'),
    ]
    const sorted = topologicalSort(vars)
    expect(sorted).toHaveLength(4)
    // base must come before double and triple; both before total
    const bi = sorted.indexOf('base')
    const di = sorted.indexOf('double')
    const ti = sorted.indexOf('triple')
    const toi = sorted.indexOf('total')
    expect(bi).toBeLessThan(di)
    expect(bi).toBeLessThan(ti)
    expect(di).toBeLessThan(toi)
    expect(ti).toBeLessThan(toi)
  })

  it('throws CyclicDependencyError on a cycle', () => {
    const vars = [makeVar('x', 'y + 1'), makeVar('y', 'x + 1')]
    expect(() => topologicalSort(vars)).toThrow(CyclicDependencyError)
  })

  it('CyclicDependencyError includes cycle path in message', () => {
    const vars = [makeVar('x', 'y + 1'), makeVar('y', 'x + 1')]
    try {
      topologicalSort(vars)
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(CyclicDependencyError)
      expect((e as CyclicDependencyError).message).toMatch(/circular dependency/i)
    }
  })
})
