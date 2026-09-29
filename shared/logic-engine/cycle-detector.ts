import type { Variable } from '../document-model/types'
import { getFormulaVariableRefs } from './calculator'

export class CyclicDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`)
    this.name = 'CyclicDependencyError'
  }
}

export interface DependencyGraph {
  nodes: Set<string>
  edges: Map<string, Set<string>> // key -> keys it depends on
}

export function buildDependencyGraph(variables: Variable[]): DependencyGraph {
  const nodes = new Set<string>()
  const edges = new Map<string, Set<string>>()

  for (const v of variables) {
    nodes.add(v.key)
    if (!edges.has(v.key)) edges.set(v.key, new Set())
  }

  for (const v of variables) {
    if (v.type === 'calculated' && v.formula) {
      const refs = getFormulaVariableRefs(v.formula)
      for (const ref of refs) {
        if (nodes.has(ref)) {
          edges.get(v.key)!.add(ref)
        }
      }
    }
  }

  return { nodes, edges }
}

// Returns keys in evaluation order (dependencies first), or throws CyclicDependencyError.
export function topologicalSort(variables: Variable[]): string[] {
  const { nodes, edges } = buildDependencyGraph(variables)

  // Kahn's algorithm
  // inDegree = how many other calculated vars depend on this key
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, Set<string>>() // key -> keys that depend on key

  for (const key of nodes) {
    if (!inDegree.has(key)) inDegree.set(key, 0)
    if (!dependents.has(key)) dependents.set(key, new Set())
  }

  for (const [key, deps] of edges) {
    for (const dep of deps) {
      inDegree.set(key, (inDegree.get(key) ?? 0) + 1)
      dependents.get(dep)!.add(key)
    }
    // reset — we set inDegree above per dependency
  }

  // Recalculate properly: in-degree = number of dependencies for each node
  const inDeg = new Map<string, number>()
  for (const key of nodes) inDeg.set(key, 0)
  for (const [key, deps] of edges) {
    inDeg.set(key, deps.size)
  }

  const queue: string[] = []
  for (const [key, deg] of inDeg) {
    if (deg === 0) queue.push(key)
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const key = queue.shift()!
    sorted.push(key)
    for (const dependent of dependents.get(key) ?? []) {
      const newDeg = (inDeg.get(dependent) ?? 0) - 1
      inDeg.set(dependent, newDeg)
      if (newDeg === 0) queue.push(dependent)
    }
  }

  if (sorted.length !== nodes.size) {
    // There are cycles — find one to report
    const remaining = [...nodes].filter((k) => !sorted.includes(k))
    const cycle = findCycle(remaining, edges)
    throw new CyclicDependencyError(cycle)
  }

  return sorted
}

function findCycle(nodes: string[], edges: Map<string, Set<string>>): string[] {
  const visited = new Set<string>()
  const stack: string[] = []
  const inStack = new Set<string>()
  let result: string[] = []

  function dfs(key: string): boolean {
    visited.add(key)
    stack.push(key)
    inStack.add(key)
    for (const dep of edges.get(key) ?? []) {
      if (inStack.has(dep)) {
        const idx = stack.indexOf(dep)
        result = [...stack.slice(idx), dep]
        return true
      }
      if (!visited.has(dep) && dfs(dep)) return true
    }
    stack.pop()
    inStack.delete(key)
    return false
  }

  for (const key of nodes) {
    if (!visited.has(key) && dfs(key)) return result
  }
  return nodes.slice(0, 2) // fallback
}

export function detectCycles(variables: Variable[]): string[][] {
  const { nodes, edges } = buildDependencyGraph(variables)
  const visited = new Set<string>()
  const cycles: string[][] = []

  function dfs(key: string, path: string[], pathSet: Set<string>): void {
    if (pathSet.has(key)) {
      const idx = path.indexOf(key)
      cycles.push([...path.slice(idx), key])
      return
    }
    if (visited.has(key)) return
    visited.add(key)
    path.push(key)
    pathSet.add(key)
    for (const dep of edges.get(key) ?? []) {
      dfs(dep, path, pathSet)
    }
    path.pop()
    pathSet.delete(key)
  }

  for (const key of nodes) {
    dfs(key, [], new Set())
  }

  return cycles
}
