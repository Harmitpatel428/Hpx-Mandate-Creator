import { describe, it, expect } from 'vitest'
import { createDefaultDocument } from '../../shared/document-model/defaults'
import { resolveDocument } from '../../shared/logic-engine/resolver'
import { validateDocument, hasErrors } from '../../shared/validation-engine'
import { generateDocxBuffer } from '../../src/main/services/export-docx.service'
import type { MandateDocument, Block, Section, Variable, LogicRule } from '../../shared/document-model/types'

/**
 * End-to-end domain flow: build a document with blocks, variables, and a
 * rule, then resolve → validate → export, asserting each stage.
 */
describe('document authoring flow', () => {
  function buildDocument(): MandateDocument {
    const doc = createDefaultDocument({ id: 'flow-1', title: 'Advisory Mandate', author: 'Tester' })

    const variables: Variable[] = [
      { id: 'v1', key: 'client', label: 'Client', description: '', type: 'text', defaultValue: 'Acme', required: true },
      { id: 'v2', key: 'base', label: 'Base Fee', description: '', type: 'currency', defaultValue: 100000, required: true },
      { id: 'v3', key: 'pct', label: 'Perf %', description: '', type: 'number', defaultValue: 10, required: false },
      { id: 'v4', key: 'total', label: 'Total', description: '', type: 'calculated', formula: 'base + (base * pct / 100)', defaultValue: null, required: false },
      { id: 'v5', key: 'perf_on', label: 'Perf on', description: '', type: 'boolean', defaultValue: true, required: false },
    ]
    doc.variables = variables
    doc.variableValues = { client: 'Acme', base: 100000, pct: 10, perf_on: true }

    const feeBlock: Block = {
      id: 'b-fee', type: 'paragraph', hidden: false, locked: false, required: false,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fee for {{client}} is {{base}}.' }] }] },
    }
    const perfBlock: Block = {
      id: 'b-perf', type: 'paragraph', hidden: true, locked: false, required: false,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Total including performance: {{total}}.' }] }] },
    }
    const heading: Block = { id: 'b-h', type: 'heading', level: 1, content: 'Engagement of {{client}}', hidden: false, locked: false, required: false }

    const section: Section = {
      id: 's1', title: 'Fees', numbering: true, hidden: false, locked: false, required: false, order: 0,
      blocks: [heading, feeBlock, perfBlock],
    }
    doc.sections = [section]

    const rule: LogicRule = {
      id: 'r1', name: 'Show perf', description: '', enabled: true, priority: 0,
      conditionGroup: { id: 'cg', logic: 'AND', conditions: [{ id: 'c1', variableKey: 'perf_on', operator: 'is_true', value: null }] },
      actions: [{ id: 'a1', type: 'show_block', targetId: 'b-perf', value: null }],
    }
    doc.rules = [rule]
    return doc
  }

  it('resolves calculated variables and rule-driven visibility', () => {
    const doc = buildDocument()
    const resolved = resolveDocument(doc)

    expect(resolved.resolvedValues.total).toBe(110000) // 100000 + 10%
    const blocks = resolved.sections[0].blocks
    expect(blocks.find((b) => b.block.id === 'b-perf')?.visible).toBe(true) // shown by rule
    expect(resolved.hasCyclicDependency).toBe(false)
  })

  it('hides the rule-gated block when the condition is false', () => {
    const doc = buildDocument()
    doc.variableValues.perf_on = false
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].blocks.find((b) => b.block.id === 'b-perf')?.visible).toBe(false)
  })

  it('validates clean with all placeholders resolvable', () => {
    const doc = buildDocument()
    const results = validateDocument(doc)
    expect(hasErrors(results)).toBe(false)
  })

  it('flags an unresolved placeholder as a warning', () => {
    const doc = buildDocument()
    ;(doc.sections[0].blocks[0] as { content: string }).content = 'Ref {{missing_key}}'
    ;(doc.sections[0].blocks[0] as { type: string }).type = 'heading'
    const results = validateDocument(doc)
    expect(results.some((r) => r.code === 'unresolved_placeholder')).toBe(true)
  })

  it('exports a valid DOCX buffer from the resolved document', async () => {
    const doc = buildDocument()
    const buf = await generateDocxBuffer(doc)
    expect(buf.length).toBeGreaterThan(0)
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK')
  })
})
