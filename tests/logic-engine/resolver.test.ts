import { describe, it, expect } from 'vitest'
import { resolveDocument } from '../../shared/logic-engine/resolver'
import type { MandateDocument, Section, Block, LogicRule } from '../../shared/document-model/types'

function makeDoc(overrides: Partial<MandateDocument> = {}): MandateDocument {
  const now = new Date().toISOString()
  return {
    schemaVersion: '1.0.0',
    id: 'doc-1',
    metadata: {
      title: 'Test',
      author: '',
      organization: '',
      status: 'draft',
      effectiveDate: null,
      expiryDate: null,
      confidentiality: 'confidential',
      documentNumber: '',
      description: '',
      language: 'en',
      tags: [],
    },
    pageSettings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 25, bottom: 25, left: 25, unit: 'mm' },
      showHeader: false,
      showFooter: false,
      showPageNumbers: true,
    },
    styles: {
      fontFamily: 'sans-serif',
      baseFontSize: 11,
      headingScale: 1.25,
      lineSpacing: 1.5,
      primaryColor: '#1d4ed8',
      tableStyle: 'bordered',
      numberingStyle: 'decimal',
    },
    variables: [],
    variableValues: {},
    parties: [],
    sections: [],
    rules: [],
    validationRules: [],
    versionMetadata: {
      schemaVersion: '1.0.0',
      createdAt: now,
      updatedAt: now,
      revisionNumber: 0,
      isFinal: false,
      snapshotLabel: '',
    },
    exportSettings: {
      includeDraftWatermark: true,
      includeAnnexes: true,
      includeInternalNotes: false,
      pageSize: 'A4',
    },
    ...overrides,
  }
}

function makeBlock(id: string, hidden = false): Block {
  return { id, type: 'paragraph', content: null, hidden, locked: false, required: false }
}

function makeSection(id: string, blocks: Block[] = [], hidden = false): Section {
  return { id, title: id, numbering: true, hidden, locked: false, required: false, blocks, order: 0 }
}

function makeRule(
  conditionGroupLogic: 'AND' | 'OR',
  conditions: LogicRule['conditionGroup']['conditions'],
  actions: LogicRule['actions'],
  enabled = true,
): LogicRule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    description: '',
    enabled,
    priority: 0,
    conditionGroup: { id: 'cg', logic: conditionGroupLogic, conditions },
    actions,
  }
}

describe('resolveDocument — base visibility', () => {
  it('visible blocks/sections are visible by default', () => {
    const block = makeBlock('b1')
    const section = makeSection('s1', [block])
    const doc = makeDoc({ sections: [section] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].visible).toBe(true)
    expect(resolved.sections[0].blocks[0].visible).toBe(true)
  })

  it('hidden blocks/sections start hidden', () => {
    const block = makeBlock('b1', true)
    const section = makeSection('s1', [block], true)
    const doc = makeDoc({ sections: [section] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].visible).toBe(false)
    expect(resolved.sections[0].blocks[0].visible).toBe(false)
  })
})

describe('resolveDocument — rule actions', () => {
  it('hide_block hides the target block when rule triggers', () => {
    const block = makeBlock('b1')
    const section = makeSection('s1', [block])
    const rule = makeRule('AND', [], [{ id: 'a1', type: 'hide_block', targetId: 'b1', value: null }])
    const doc = makeDoc({ sections: [section], rules: [rule] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].blocks[0].visible).toBe(false)
  })

  it('show_block overrides hidden block when rule triggers', () => {
    const block = makeBlock('b1', true)
    const section = makeSection('s1', [block])
    const rule = makeRule('AND', [], [{ id: 'a1', type: 'show_block', targetId: 'b1', value: null }])
    const doc = makeDoc({ sections: [section], rules: [rule] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].blocks[0].visible).toBe(true)
  })

  it('hide_section hides the target section', () => {
    const section = makeSection('s1', [])
    const rule = makeRule('AND', [], [{ id: 'a1', type: 'hide_section', targetId: 's1', value: null }])
    const doc = makeDoc({ sections: [section], rules: [rule] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].visible).toBe(false)
  })

  it('rule does NOT trigger when condition fails', () => {
    const block = makeBlock('b1')
    const section = makeSection('s1', [block])
    const rule = makeRule(
      'AND',
      [{ id: 'c1', variableKey: 'flag', operator: 'equals', value: 'yes' }],
      [{ id: 'a1', type: 'hide_block', targetId: 'b1', value: null }],
    )
    const doc = makeDoc({
      sections: [section],
      rules: [rule],
      variables: [{ id: 'v1', key: 'flag', label: 'Flag', description: '', type: 'text', defaultValue: null, required: false }],
      variableValues: { flag: 'no' },
    })
    const resolved = resolveDocument(doc)
    // block should remain visible since condition didn't pass
    expect(resolved.sections[0].blocks[0].visible).toBe(true)
  })

  it('rule triggers when condition passes, hides block', () => {
    const block = makeBlock('b1')
    const section = makeSection('s1', [block])
    const rule = makeRule(
      'AND',
      [{ id: 'c1', variableKey: 'flag', operator: 'equals', value: 'yes' }],
      [{ id: 'a1', type: 'hide_block', targetId: 'b1', value: null }],
    )
    const doc = makeDoc({
      sections: [section],
      rules: [rule],
      variables: [{ id: 'v1', key: 'flag', label: 'Flag', description: '', type: 'text', defaultValue: null, required: false }],
      variableValues: { flag: 'yes' },
    })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].blocks[0].visible).toBe(false)
  })

  it('disabled rules have no effect', () => {
    const block = makeBlock('b1')
    const section = makeSection('s1', [block])
    const rule = makeRule('AND', [], [{ id: 'a1', type: 'hide_block', targetId: 'b1', value: null }], false)
    const doc = makeDoc({ sections: [section], rules: [rule] })
    const resolved = resolveDocument(doc)
    expect(resolved.sections[0].blocks[0].visible).toBe(true) // rule disabled
  })

  it('set_variable updates resolved values', () => {
    const section = makeSection('s1', [])
    const rule = makeRule(
      'AND',
      [],
      [{ id: 'a1', type: 'set_variable', targetId: 'fee', value: 5000 }],
    )
    const doc = makeDoc({
      sections: [section],
      rules: [rule],
      variables: [{ id: 'v1', key: 'fee', label: 'Fee', description: '', type: 'number', defaultValue: 0, required: false }],
    })
    const resolved = resolveDocument(doc)
    expect(resolved.resolvedValues['fee']).toBe(5000)
  })
})

describe('resolveDocument — calculated variables', () => {
  it('evaluates a simple formula', () => {
    const doc = makeDoc({
      variables: [
        { id: 'v1', key: 'rate', label: 'Rate', description: '', type: 'number', defaultValue: 100, required: false },
        { id: 'v2', key: 'fee', label: 'Fee', description: '', type: 'calculated', formula: 'rate * 0.1', defaultValue: null, required: false },
      ],
      variableValues: { rate: 200 },
    })
    const resolved = resolveDocument(doc)
    expect(resolved.resolvedValues['fee']).toBe(20)
  })
})
