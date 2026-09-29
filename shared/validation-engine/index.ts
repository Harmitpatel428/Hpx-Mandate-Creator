import type { MandateDocument } from '../document-model/types'
import { resolveDocument } from '../logic-engine/resolver'
import { detectCycles } from '../logic-engine/cycle-detector'
import { validateFormula } from '../logic-engine/calculator'

export type ValidationSeverity = 'error' | 'warning'
export type ValidationCode =
  | 'missing_required'
  | 'unresolved_placeholder'
  | 'circular_dependency'
  | 'invalid_formula'
  | 'duplicate_variable_key'

export type ValidationTargetType = 'block' | 'section' | 'variable' | 'document'

export interface ValidationResult {
  id: string
  severity: ValidationSeverity
  code: ValidationCode
  message: string
  targetId: string
  targetType: ValidationTargetType
}

// Extract all {{key}} placeholders from a string
function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g) ?? []
  return matches.map((m) => m.slice(2, -2))
}

// Extract text content from Tiptap JSON doc
function extractTiptapText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: string; content?: unknown[] }
  const parts: string[] = []
  if (node.text) parts.push(node.text)
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      parts.push(extractTiptapText(child))
    }
  }
  return parts.join(' ')
}

let _idCounter = 0
function nextId() {
  return `vr-${++_idCounter}`
}

export function validateDocument(doc: MandateDocument): ValidationResult[] {
  const results: ValidationResult[] = []
  const resolved = resolveDocument(doc)
  const definedKeys = new Set(doc.variables.map((v) => v.key))

  // 1. Duplicate variable keys
  const seenKeys = new Set<string>()
  for (const v of doc.variables) {
    if (seenKeys.has(v.key)) {
      results.push({
        id: nextId(),
        severity: 'error',
        code: 'duplicate_variable_key',
        message: `Variable key "{{${v.key}}}" is used more than once`,
        targetId: v.id,
        targetType: 'variable',
      })
    }
    seenKeys.add(v.key)
  }

  // 2. Circular dependencies
  const cycles = detectCycles(doc.variables)
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      results.push({
        id: nextId(),
        severity: 'error',
        code: 'circular_dependency',
        message: `Circular dependency: ${cycle.join(' → ')}`,
        targetId: 'document',
        targetType: 'document',
      })
    }
  }

  // 3. Invalid formulas
  for (const v of doc.variables) {
    if (v.type === 'calculated' && v.formula) {
      const { valid, error } = validateFormula(v.formula)
      if (!valid) {
        results.push({
          id: nextId(),
          severity: 'error',
          code: 'invalid_formula',
          message: `Formula error in "${v.label}": ${error}`,
          targetId: v.id,
          targetType: 'variable',
        })
      }
    }
  }

  // 4. Missing required & unresolved placeholders — run against resolved state
  for (const rs of resolved.sections) {
    if (!rs.visible) continue

    if (rs.required && !rs.section.title?.trim()) {
      results.push({
        id: nextId(),
        severity: 'error',
        code: 'missing_required',
        message: `Required section "${rs.section.title || 'Untitled'}" has no title`,
        targetId: rs.section.id,
        targetType: 'section',
      })
    }

    for (const rb of rs.blocks) {
      if (!rb.visible) continue

      // Missing required content
      if (rb.required) {
        const block = rb.block
        let isEmpty = false
        if (block.type === 'heading') isEmpty = !block.content?.trim()
        else if (block.type === 'paragraph') isEmpty = !block.content
        else if (block.type === 'plain-text') isEmpty = !block.content?.trim()
        else if (block.type === 'note') isEmpty = !block.content?.trim()

        if (isEmpty) {
          results.push({
            id: nextId(),
            severity: 'error',
            code: 'missing_required',
            message: `Required block (${block.type}) has no content`,
            targetId: block.id,
            targetType: 'block',
          })
        }
      }

      // Unresolved placeholders
      const block = rb.block
      let textToCheck = ''
      if (block.type === 'heading') textToCheck = block.content ?? ''
      else if (block.type === 'paragraph') textToCheck = extractTiptapText(block.content)
      else if (block.type === 'plain-text') textToCheck = block.content ?? ''
      else if (block.type === 'note') textToCheck = block.content ?? ''

      for (const placeholder of extractPlaceholders(textToCheck)) {
        if (!definedKeys.has(placeholder)) {
          results.push({
            id: nextId(),
            severity: 'warning',
            code: 'unresolved_placeholder',
            message: `Unresolved placeholder "{{${placeholder}}}" — no matching variable`,
            targetId: block.id,
            targetType: 'block',
          })
        }
      }
    }
  }

  return results
}

export function hasErrors(results: ValidationResult[]): boolean {
  return results.some((r) => r.severity === 'error')
}
