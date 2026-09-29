import type { MandateDocument, Section, Block, Variable } from './types'
import type { ClauseRecord } from './library'
import { cloneSectionWithNewIds, cloneBlockWithNewId } from './clone'
import { rewritePlaceholderKeys, extractPlaceholderKeys } from './render-utils'
import { generateId } from '../utils/id'

interface TiptapNode {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

function rewriteTiptapKeys(content: unknown, keyRemap: Record<string, string>): unknown {
  if (!content || typeof content !== 'object') return content
  const node = content as TiptapNode
  const next: TiptapNode = { ...node }
  if (typeof node.text === 'string') next.text = rewritePlaceholderKeys(node.text, keyRemap)
  if (node.type === 'variablePlaceholder' && node.attrs && typeof node.attrs.key === 'string') {
    const mapped = keyRemap[node.attrs.key as string]
    if (mapped) next.attrs = { ...node.attrs, key: mapped }
  }
  if (Array.isArray(node.content)) next.content = node.content.map((c) => rewriteTiptapKeys(c, keyRemap) as TiptapNode)
  return next
}

/** Rewrite every {{key}} reference inside a block according to the remap. */
function rewriteBlockKeys(block: Block, keyRemap: Record<string, string>): Block {
  const b = block as Block & Record<string, unknown>
  switch (block.type) {
    case 'heading':
    case 'plain-text':
    case 'note':
      return { ...block, content: rewritePlaceholderKeys((b.content as string) ?? '', keyRemap) } as Block
    case 'paragraph':
      return { ...block, content: rewriteTiptapKeys(block.content, keyRemap) } as Block
    case 'signature':
      return {
        ...block,
        signatoryName: rewritePlaceholderKeys(block.signatoryName ?? '', keyRemap),
        signatoryTitle: rewritePlaceholderKeys(block.signatoryTitle ?? '', keyRemap),
      } as Block
    case 'table':
      return {
        ...block,
        columns: block.columns.map((c) => ({ ...c, header: rewritePlaceholderKeys(c.header ?? '', keyRemap) })),
        rows: block.rows.map((r) => ({
          ...r,
          cells: r.cells.map((cell) => ({ ...cell, content: rewritePlaceholderKeys(cell.content ?? '', keyRemap) })),
        })),
      } as Block
    default:
      return block
  }
}

/** Collect all placeholder keys referenced across a set of blocks. */
export function collectClauseKeys(clause: ClauseRecord): string[] {
  const keys = new Set<string>()
  const scan = (block: Block) => {
    const b = block as Block & Record<string, unknown>
    if (block.type === 'heading' || block.type === 'plain-text' || block.type === 'note') {
      extractPlaceholderKeys((b.content as string) ?? '').forEach((k) => keys.add(k))
    } else if (block.type === 'signature') {
      extractPlaceholderKeys(block.signatoryName ?? '').forEach((k) => keys.add(k))
      extractPlaceholderKeys(block.signatoryTitle ?? '').forEach((k) => keys.add(k))
    } else if (block.type === 'table') {
      block.columns.forEach((c) => extractPlaceholderKeys(c.header ?? '').forEach((k) => keys.add(k)))
      block.rows.forEach((r) => r.cells.forEach((cell) => extractPlaceholderKeys(cell.content ?? '').forEach((k) => keys.add(k))))
    } else if (block.type === 'paragraph') {
      const scanNode = (n: TiptapNode) => {
        if (typeof n.text === 'string') extractPlaceholderKeys(n.text).forEach((k) => keys.add(k))
        if (n.type === 'variablePlaceholder' && typeof n.attrs?.key === 'string') keys.add(n.attrs.key as string)
        n.content?.forEach(scanNode)
      }
      const root = block.content as TiptapNode | null
      if (root?.content) root.content.forEach(scanNode)
    }
  }
  const blocks = clause.kind === 'section' && clause.section ? clause.section.blocks : clause.blocks
  blocks.forEach(scan)
  clause.variables.forEach((v) => keys.add(v.key))
  return [...keys]
}

export interface InsertClauseOptions {
  /** Target section for 'blocks' clauses. Ignored for 'section' clauses. */
  targetSectionId?: string
  /**
   * Map from the clause's variable key to the key it should use in the
   * target document. Keys absent from the map keep their original key.
   */
  keyRemap?: Record<string, string>
}

export interface InsertClauseResult {
  doc: MandateDocument
  addedVariableKeys: string[]
  /** Required variable keys the clause needs that have no value in the doc. */
  missingRequired: string[]
}

/**
 * Insert a clause into a document, returning a new document. Block/section
 * ids are regenerated; placeholder references are remapped; referenced
 * variables that don't already exist are added. Pure — does not mutate the
 * input document.
 */
export function insertClauseIntoDocument(
  doc: MandateDocument,
  clause: ClauseRecord,
  options: InsertClauseOptions = {},
): InsertClauseResult {
  const keyRemap = options.keyRemap ?? {}
  const existingKeys = new Set(doc.variables.map((v) => v.key))
  const idMap = new Map<string, string>()

  const next: MandateDocument = {
    ...doc,
    sections: doc.sections.map((s) => ({ ...s, blocks: [...s.blocks] })),
    variables: [...doc.variables],
    variableValues: { ...doc.variableValues },
  }

  // Merge variables (respecting remap; only add when the effective key is new).
  const addedVariableKeys: string[] = []
  for (const v of clause.variables) {
    const effectiveKey = keyRemap[v.key] ?? v.key
    if (!existingKeys.has(effectiveKey)) {
      const newVar: Variable = { ...v, id: generateId(), key: effectiveKey }
      next.variables.push(newVar)
      existingKeys.add(effectiveKey)
      addedVariableKeys.push(effectiveKey)
    }
  }

  if (clause.kind === 'section' && clause.section) {
    const cloned = cloneSectionWithNewIds(clause.section, idMap)
    cloned.blocks = cloned.blocks.map((b) => rewriteBlockKeys(b, keyRemap))
    cloned.order = next.sections.length
    next.sections = [...next.sections, cloned]
  } else {
    const clonedBlocks = clause.blocks.map((b) => rewriteBlockKeys(cloneBlockWithNewId(b, idMap), keyRemap))
    const targetId = options.targetSectionId
    const target = targetId ? next.sections.find((s) => s.id === targetId) : undefined
    if (target) {
      const idx = next.sections.indexOf(target)
      next.sections[idx] = { ...target, blocks: [...target.blocks, ...clonedBlocks] }
    } else {
      // No target: append as a new untitled section.
      next.sections = [
        ...next.sections,
        {
          id: generateId(),
          title: clause.name,
          numbering: true,
          hidden: false,
          locked: false,
          required: false,
          blocks: clonedBlocks,
          order: next.sections.length,
        } as Section,
      ]
    }
  }

  // Compute required variables that still have no value in the document.
  const missingRequired: string[] = []
  for (const v of clause.variables) {
    if (!v.required) continue
    const effectiveKey = keyRemap[v.key] ?? v.key
    const hasValue =
      next.variableValues[effectiveKey] !== undefined && next.variableValues[effectiveKey] !== null && next.variableValues[effectiveKey] !== ''
    const defaulted = next.variables.find((dv) => dv.key === effectiveKey)?.defaultValue
    if (!hasValue && (defaulted === undefined || defaulted === null || defaulted === '')) {
      missingRequired.push(effectiveKey)
    }
  }

  return { doc: next, addedVariableKeys, missingRequired }
}
