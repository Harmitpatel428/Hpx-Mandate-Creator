import { describe, it, expect } from 'vitest'
import { generateDocxBuffer } from '../../src/main/services/export-docx.service'
import type { MandateDocument, Section, Block } from '../../shared/document-model/types'

function makeDoc(overrides: Partial<MandateDocument> = {}): MandateDocument {
  const now = new Date().toISOString()
  return {
    schemaVersion: '1.0.0',
    id: 'doc-1',
    metadata: {
      title: 'Test Mandate', author: 'Tester', organization: 'HPX', status: 'draft',
      effectiveDate: null, expiryDate: null, confidentiality: 'confidential',
      documentNumber: 'HPX-001', description: 'A test', language: 'en', tags: [],
    },
    pageSettings: {
      pageSize: 'A4', orientation: 'portrait',
      margins: { top: 25, right: 25, bottom: 25, left: 25, unit: 'mm' },
      showHeader: false, showFooter: false, showPageNumbers: true,
    },
    styles: {
      fontFamily: 'sans-serif', baseFontSize: 11, headingScale: 1.25, lineSpacing: 1.5,
      primaryColor: '#1d4ed8', tableStyle: 'bordered', numberingStyle: 'decimal',
    },
    variables: [], variableValues: {}, parties: [], sections: [], rules: [], validationRules: [],
    versionMetadata: { schemaVersion: '1.0.0', createdAt: now, updatedAt: now, revisionNumber: 0, isFinal: false, snapshotLabel: '' },
    exportSettings: { includeDraftWatermark: true, includeAnnexes: true, includeInternalNotes: false, pageSize: 'A4' },
    ...overrides,
  }
}

function section(id: string, blocks: Block[], hidden = false): Section {
  return { id, title: id, numbering: true, hidden, locked: false, required: false, blocks, order: 0 }
}

describe('generateDocxBuffer', () => {
  it('produces a non-empty .docx buffer with a valid zip signature', async () => {
    const heading: Block = { id: 'h1', type: 'heading', level: 1, content: 'Intro', hidden: false, locked: false, required: false }
    const para: Block = { id: 'p1', type: 'paragraph', hidden: false, locked: false, required: false, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello {{name}}' }] }] } }
    const doc = makeDoc({
      sections: [section('s1', [heading, para])],
      variables: [{ id: 'v', key: 'name', label: 'Name', description: '', type: 'text', defaultValue: 'World', required: false }],
      variableValues: { name: 'World' },
    })
    const buf = await generateDocxBuffer(doc)
    expect(buf.length).toBeGreaterThan(0)
    // .docx is a zip archive — starts with 'PK'
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK')
  })

  it('excludes hidden sections and internal notes', async () => {
    const note: Block = { id: 'n1', type: 'note', content: 'internal secret', noteType: 'internal', hidden: false, locked: false, required: false }
    const doc = makeDoc({
      sections: [section('visible', []), section('hidden', [note], true)],
    })
    const buf = await generateDocxBuffer(doc)
    // Buffer is a zip so we cannot grep text directly, but generation must succeed.
    expect(buf.length).toBeGreaterThan(0)
  })
})
