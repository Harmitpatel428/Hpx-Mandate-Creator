import { describe, it, expect } from 'vitest'
import { insertClauseIntoDocument, collectClauseKeys } from '../../shared/document-model/clause-insert'
import { createDefaultDocument } from '../../shared/document-model/defaults'
import type { MandateDocument, Block } from '../../shared/document-model/types'
import type { ClauseRecord } from '../../shared/document-model/library'

function makeDoc(): MandateDocument {
  const doc = createDefaultDocument({ id: 'doc-1', title: 'Doc' })
  doc.sections = [{ id: 'sec-1', title: 'Main', numbering: true, hidden: false, locked: false, required: false, order: 0, blocks: [] }]
  return doc
}

function blockClause(): ClauseRecord {
  const block: Block = { id: 'cb-1', type: 'heading', level: 2, content: 'Governed by {{jurisdiction}}', hidden: false, locked: false, required: false }
  return {
    id: 'cl-1', name: 'Governing Law', description: '', category: 'Governing Law', tags: [], isSample: false,
    kind: 'blocks', section: null, blocks: [block],
    variables: [{ id: 'cv-1', key: 'jurisdiction', label: 'Jurisdiction', description: '', type: 'text', defaultValue: '', required: true }],
    createdAt: '', updatedAt: '',
  }
}

describe('collectClauseKeys', () => {
  it('collects placeholder keys and declared variable keys', () => {
    const keys = collectClauseKeys(blockClause())
    expect(keys).toContain('jurisdiction')
  })
})

describe('insertClauseIntoDocument', () => {
  it('appends blocks with regenerated ids into the target section', () => {
    const doc = makeDoc()
    const { doc: next } = insertClauseIntoDocument(doc, blockClause(), { targetSectionId: 'sec-1' })
    const target = next.sections.find((s) => s.id === 'sec-1')!
    expect(target.blocks).toHaveLength(1)
    expect(target.blocks[0].id).not.toBe('cb-1') // id regenerated
  })

  it('adds the clause variable when the key is new', () => {
    const doc = makeDoc()
    const { doc: next, addedVariableKeys } = insertClauseIntoDocument(doc, blockClause(), { targetSectionId: 'sec-1' })
    expect(addedVariableKeys).toContain('jurisdiction')
    expect(next.variables.some((v) => v.key === 'jurisdiction')).toBe(true)
  })

  it('remaps placeholders and does not add a variable when mapped to an existing key', () => {
    const doc = makeDoc()
    doc.variables = [{ id: 'ex-1', key: 'place', label: 'Place', description: '', type: 'text', defaultValue: 'Mumbai', required: false }]
    doc.variableValues = { place: 'Mumbai' }

    const { doc: next, addedVariableKeys } = insertClauseIntoDocument(doc, blockClause(), {
      targetSectionId: 'sec-1',
      keyRemap: { jurisdiction: 'place' },
    })

    expect(addedVariableKeys).not.toContain('place')
    const inserted = next.sections[0].blocks[0] as { content: string }
    expect(inserted.content).toBe('Governed by {{place}}') // placeholder rewritten
  })

  it('reports required variables that will lack a value', () => {
    const doc = makeDoc()
    const { missingRequired } = insertClauseIntoDocument(doc, blockClause(), { targetSectionId: 'sec-1' })
    expect(missingRequired).toContain('jurisdiction') // required, no default/value
  })

  it('does not mutate the input document', () => {
    const doc = makeDoc()
    insertClauseIntoDocument(doc, blockClause(), { targetSectionId: 'sec-1' })
    expect(doc.sections[0].blocks).toHaveLength(0)
    expect(doc.variables).toHaveLength(0)
  })

  it('appends a section clause as a new section', () => {
    const doc = makeDoc()
    const sectionClause: ClauseRecord = {
      id: 'cl-2', name: 'Confidentiality', description: '', category: 'Confidentiality', tags: [], isSample: false,
      kind: 'section',
      section: { id: 'cs-1', title: 'Confidentiality', numbering: true, hidden: false, locked: false, required: false, order: 0, blocks: [] },
      blocks: [], variables: [], createdAt: '', updatedAt: '',
    }
    const { doc: next } = insertClauseIntoDocument(doc, sectionClause)
    expect(next.sections).toHaveLength(2)
    expect(next.sections[1].id).not.toBe('cs-1')
  })
})
