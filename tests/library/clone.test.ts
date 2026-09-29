import { describe, it, expect } from 'vitest'
import { cloneDocumentWithNewIds } from '../../shared/document-model/clone'
import { createDefaultDocument } from '../../shared/document-model/defaults'
import type { MandateDocument, Block, Section, LogicRule } from '../../shared/document-model/types'

function buildTemplate(): MandateDocument {
  const doc = createDefaultDocument({ id: 'tpl-1', title: 'Template' })
  const block: Block = { id: 'blk-1', type: 'paragraph', hidden: false, locked: false, required: false, content: null }
  const section: Section = { id: 'sec-1', title: 'S', numbering: true, hidden: false, locked: false, required: false, order: 0, blocks: [block] }
  doc.sections = [section]
  doc.variables = [{ id: 'var-1', key: 'client', label: 'Client', description: '', type: 'text', defaultValue: 'X', required: true }]
  const rule: LogicRule = {
    id: 'rule-1', name: 'Hide', description: '', enabled: true, priority: 0,
    conditionGroup: { id: 'cg-1', logic: 'AND', conditions: [] },
    actions: [{ id: 'act-1', type: 'hide_block', targetId: 'blk-1', value: null }],
  }
  doc.rules = [rule]
  return doc
}

describe('cloneDocumentWithNewIds', () => {
  it('regenerates document, section, and block ids', () => {
    const tpl = buildTemplate()
    const clone = cloneDocumentWithNewIds(tpl, { id: 'new-doc', title: 'New' })

    expect(clone.id).toBe('new-doc')
    expect(clone.metadata.title).toBe('New')
    expect(clone.sections[0].id).not.toBe('sec-1')
    expect(clone.sections[0].blocks[0].id).not.toBe('blk-1')
    expect(clone.rules[0].id).not.toBe('rule-1')
  })

  it('remaps rule action target ids to the new block ids', () => {
    const tpl = buildTemplate()
    const clone = cloneDocumentWithNewIds(tpl)
    const newBlockId = clone.sections[0].blocks[0].id
    expect(clone.rules[0].actions[0].targetId).toBe(newBlockId)
    expect(clone.rules[0].actions[0].targetId).not.toBe('blk-1')
  })

  it('preserves variable keys but regenerates variable ids', () => {
    const tpl = buildTemplate()
    const clone = cloneDocumentWithNewIds(tpl)
    expect(clone.variables[0].key).toBe('client') // key preserved (formulas rely on it)
    expect(clone.variables[0].id).not.toBe('var-1')
  })

  it('produces a fully decoupled copy (no shared references)', () => {
    const tpl = buildTemplate()
    const clone = cloneDocumentWithNewIds(tpl)
    clone.sections[0].title = 'changed'
    expect(tpl.sections[0].title).toBe('S')
  })

  it('resets version metadata', () => {
    const tpl = buildTemplate()
    tpl.versionMetadata.revisionNumber = 7
    tpl.versionMetadata.isFinal = true
    const clone = cloneDocumentWithNewIds(tpl)
    expect(clone.versionMetadata.revisionNumber).toBe(0)
    expect(clone.versionMetadata.isFinal).toBe(false)
  })
})
