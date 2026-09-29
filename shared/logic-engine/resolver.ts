import type { MandateDocument, Block, Section } from '../document-model/types'
import { evaluateConditionGroup } from './evaluator'
import { evaluateFormula } from './calculator'
import { topologicalSort, CyclicDependencyError } from './cycle-detector'

export interface ResolvedBlock {
  block: Block
  visible: boolean
  required: boolean
}

export interface ResolvedSection {
  section: Section
  visible: boolean
  required: boolean
  blocks: ResolvedBlock[]
}

export interface ResolvedDocument {
  doc: MandateDocument
  sections: ResolvedSection[]
  resolvedValues: Record<string, unknown>
  hasCyclicDependency: boolean
}

export function resolveDocument(
  doc: MandateDocument,
  overrideValues?: Record<string, unknown>,
): ResolvedDocument {
  // 1. Merge variable values (overrides take precedence, then defaults)
  const baseValues: Record<string, unknown> = {}
  for (const v of doc.variables) {
    baseValues[v.key] = overrideValues?.[v.key] ?? doc.variableValues[v.key] ?? v.defaultValue ?? null
  }

  // 2. Evaluate calculated variables in topological order
  let sortedKeys: string[]
  let hasCyclicDependency = false
  try {
    sortedKeys = topologicalSort(doc.variables)
  } catch (e) {
    if (e instanceof CyclicDependencyError) {
      hasCyclicDependency = true
      sortedKeys = doc.variables.map((v) => v.key) // best-effort order
    } else {
      throw e
    }
  }

  const resolvedValues = { ...baseValues }
  for (const key of sortedKeys) {
    const v = doc.variables.find((v) => v.key === key)
    if (!v || v.type !== 'calculated' || !v.formula) continue
    try {
      resolvedValues[key] = evaluateFormula(v.formula, resolvedValues)
    } catch {
      resolvedValues[key] = null
    }
  }

  // 3. Start with base visibility from block/section .hidden flags
  // Build a mutable map of section visibility and block visibility
  const sectionVisible = new Map<string, boolean>()
  const sectionRequired = new Map<string, boolean>()
  const blockVisible = new Map<string, boolean>()
  const blockRequired = new Map<string, boolean>()

  for (const section of doc.sections) {
    sectionVisible.set(section.id, !section.hidden)
    sectionRequired.set(section.id, section.required)
    for (const block of section.blocks) {
      blockVisible.set(block.id, !block.hidden)
      blockRequired.set(block.id, block.required)
    }
  }

  // 4. Apply rules in priority order
  const sortedRules = [...doc.rules]
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    const triggered = evaluateConditionGroup(rule.conditionGroup, resolvedValues)
    if (!triggered) continue

    for (const action of rule.actions) {
      switch (action.type) {
        case 'show_block':
          blockVisible.set(action.targetId, true)
          break
        case 'hide_block':
          blockVisible.set(action.targetId, false)
          break
        case 'show_section':
          sectionVisible.set(action.targetId, true)
          break
        case 'hide_section':
          sectionVisible.set(action.targetId, false)
          break
        case 'set_variable': {
          const varKey = action.targetId
          resolvedValues[varKey] = action.value
          break
        }
        case 'mark_required':
          if (blockVisible.has(action.targetId)) {
            blockRequired.set(action.targetId, true)
          } else {
            sectionRequired.set(action.targetId, true)
          }
          break
        case 'mark_optional':
          if (blockVisible.has(action.targetId)) {
            blockRequired.set(action.targetId, false)
          } else {
            sectionRequired.set(action.targetId, false)
          }
          break
      }
    }
  }

  // 5. Build resolved document
  const sections: ResolvedSection[] = doc.sections.map((section) => ({
    section,
    visible: sectionVisible.get(section.id) ?? true,
    required: sectionRequired.get(section.id) ?? section.required,
    blocks: section.blocks.map((block) => ({
      block,
      visible: blockVisible.get(block.id) ?? true,
      required: blockRequired.get(block.id) ?? block.required,
    })),
  }))

  return { doc, sections, resolvedValues, hasCyclicDependency }
}
