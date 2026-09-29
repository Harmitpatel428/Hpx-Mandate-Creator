import type { MandateDocument, Section, Block, Variable, LogicRule } from './types'
import { generateId } from '../utils/id'

/**
 * Deep clone helper. structuredClone is available in Node 17+ and modern
 * browsers (Electron renderer), with a JSON fallback for safety.
 */
function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Remap any string field that holds a section/block/rule id through the
 * given old→new id map. Variable keys are UUID-disjoint so they are never
 * accidentally rewritten.
 */
function remapId(id: string | undefined, map: Map<string, string>): string | undefined {
  if (id === undefined) return undefined
  return map.get(id) ?? id
}

function cloneRulesWithMap(rules: LogicRule[], idMap: Map<string, string>): LogicRule[] {
  return rules.map((rule) => {
    const cloned = deepClone(rule)
    cloned.id = idMap.get(rule.id) ?? generateId()
    cloned.conditionGroup = { ...cloned.conditionGroup, id: generateId() }
    cloned.conditionGroup.conditions = cloned.conditionGroup.conditions.map((c) => ({
      ...c,
      id: generateId(),
    }))
    cloned.actions = cloned.actions.map((a) => ({
      ...a,
      id: generateId(),
      // targetId may be a block/section id (remap) or a variable key (unchanged).
      targetId: remapId(a.targetId, idMap) ?? a.targetId,
    }))
    return cloned
  })
}

/** Clone a block, assigning it a fresh id and recording the old→new mapping. */
export function cloneBlockWithNewId(block: Block, idMap: Map<string, string>): Block {
  const cloned = deepClone(block)
  const newId = generateId()
  idMap.set(block.id, newId)
  cloned.id = newId
  return cloned
}

/** Clone a section (and its blocks), assigning fresh ids throughout. */
export function cloneSectionWithNewIds(section: Section, idMap: Map<string, string>): Section {
  const cloned = deepClone(section)
  const newId = generateId()
  idMap.set(section.id, newId)
  cloned.id = newId
  cloned.blocks = section.blocks.map((b) => cloneBlockWithNewId(b, idMap))
  return cloned
}

/** Clone a variable, assigning a fresh id but preserving its key. */
export function cloneVariableWithNewId(variable: Variable): Variable {
  const cloned = deepClone(variable)
  cloned.id = generateId()
  return cloned
}

export interface CloneDocumentOverrides {
  id?: string
  title?: string
  author?: string
  status?: MandateDocument['metadata']['status']
}

/**
 * Produce a deep copy of a document with entirely new ids for the document,
 * its sections, blocks, variables, and rules. Cross-references (rule action
 * targets that point at blocks/sections, and conditionalRef pointers) are
 * remapped so the clone is internally consistent and fully decoupled from
 * the source. Variable *keys* are preserved (formulas/placeholders rely on
 * them); only their ids change.
 */
export function cloneDocumentWithNewIds(
  doc: MandateDocument,
  overrides: CloneDocumentOverrides = {},
): MandateDocument {
  const idMap = new Map<string, string>()

  // Pre-map rule ids so conditionalRef pointers resolve regardless of order.
  for (const rule of doc.rules) idMap.set(rule.id, generateId())

  const sections = doc.sections.map((s) => {
    const cloned = cloneSectionWithNewIds(s, idMap)
    if (cloned.conditionalRef) cloned.conditionalRef = remapId(cloned.conditionalRef, idMap)
    cloned.blocks = cloned.blocks.map((b) => {
      if (b.conditionalRef) return { ...b, conditionalRef: remapId(b.conditionalRef, idMap) }
      return b
    })
    return cloned
  })

  const variables = doc.variables.map(cloneVariableWithNewId)
  const rules = cloneRulesWithMap(doc.rules, idMap)

  const now = new Date().toISOString()
  const cloned: MandateDocument = {
    ...deepClone(doc),
    id: overrides.id ?? generateId(),
    sections,
    variables,
    rules,
    metadata: {
      ...doc.metadata,
      ...(overrides.title !== undefined ? { title: overrides.title } : {}),
      ...(overrides.author !== undefined ? { author: overrides.author } : {}),
      ...(overrides.status !== undefined ? { status: overrides.status } : {}),
    },
    versionMetadata: {
      ...doc.versionMetadata,
      createdAt: now,
      updatedAt: now,
      revisionNumber: 0,
      isFinal: false,
      snapshotLabel: '',
    },
  }
  return cloned
}
