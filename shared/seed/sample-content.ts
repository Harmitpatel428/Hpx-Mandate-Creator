import type {
  MandateDocument,
  Section,
  Block,
  Variable,
  LogicRule,
} from '../document-model/types'
import type { ClauseRecord } from '../document-model/library'
import { createDefaultDocument } from '../document-model/defaults'
import { generateId } from '../utils/id'

function para(text: string): Block {
  return {
    id: generateId(),
    type: 'paragraph',
    hidden: false,
    locked: false,
    required: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] },
  }
}

function heading(content: string, level: 1 | 2 | 3 = 2): Block {
  return { id: generateId(), type: 'heading', level, content, hidden: false, locked: false, required: false }
}

function note(content: string, noteType: 'info' | 'warning' | 'internal' = 'info'): Block {
  return { id: generateId(), type: 'note', content, noteType, hidden: false, locked: false, required: false }
}

function signature(name: string, title: string): Block {
  return {
    id: generateId(),
    type: 'signature',
    signatoryName: name,
    signatoryTitle: title,
    showDateLine: true,
    showPlaceLine: false,
    hidden: false,
    locked: false,
    required: false,
  }
}

function section(title: string, blocks: Block[], order: number, extra: Partial<Section> = {}): Section {
  return {
    id: generateId(),
    title,
    numbering: true,
    hidden: false,
    locked: false,
    required: false,
    blocks,
    order,
    ...extra,
  }
}

function variable(
  key: string,
  label: string,
  type: Variable['type'],
  extra: Partial<Variable> = {},
): Variable {
  return {
    id: generateId(),
    key,
    label,
    description: '',
    type,
    defaultValue: null,
    required: false,
    ...extra,
  }
}

export function buildSampleMandate(): MandateDocument {
  const doc = createDefaultDocument({ title: 'Investment Advisory Mandate (Sample)', author: 'HPX Advisory LLP' })
  doc.metadata.description = 'A sample mandate demonstrating variables, logic, and export.'
  doc.metadata.organization = 'HPX Advisory LLP'
  doc.metadata.documentNumber = 'HPX-SAMPLE-001'
  doc.metadata.tags = ['Sample']

  const variables: Variable[] = [
    variable('client_name', 'Client Name', 'text', { defaultValue: 'Acme Industries Pvt. Ltd.', required: true }),
    variable('advisor_name', 'Advisor Name', 'text', { defaultValue: 'HPX Advisory LLP', required: true }),
    variable('effective_date', 'Effective Date', 'date', { defaultValue: '2026-04-01' }),
    variable('base_fee', 'Base Advisory Fee', 'currency', { defaultValue: 500000, required: true, formatting: { currency: 'INR' } }),
    variable('performance_pct', 'Performance Fee (%)', 'number', { defaultValue: 10, formatting: { decimalPlaces: 0 } }),
    variable('has_performance_fee', 'Include Performance Fee', 'boolean', { defaultValue: true }),
    variable('total_fee', 'Total First-Year Fee', 'calculated', {
      formula: 'base_fee + (base_fee * performance_pct / 100)',
      defaultValue: null,
    }),
  ]
  doc.variables = variables
  doc.variableValues = {
    client_name: 'Acme Industries Pvt. Ltd.',
    advisor_name: 'HPX Advisory LLP',
    effective_date: '2026-04-01',
    base_fee: 500000,
    performance_pct: 10,
    has_performance_fee: true,
  }

  const perfBlock = para(
    'In addition to the base fee, a performance fee of {{performance_pct}}% shall apply, bringing the total first-year fee to {{total_fee}}.',
  )
  perfBlock.hidden = true

  const parties = section('Parties', [
    para('This Investment Advisory Mandate is entered into between {{client_name}} ("Client") and {{advisor_name}} ("Advisor"), effective {{effective_date}}.'),
  ], 0)

  const scope = section('Scope of Services', [
    para('The Advisor shall provide investment advisory services to the Client, including portfolio construction, periodic review, and rebalancing recommendations.'),
    note('This is sample content for demonstration purposes.', 'info'),
  ], 1)

  const fees = section('Fees', [
    para('The Client shall pay the Advisor a base advisory fee of {{base_fee}} per annum.'),
    perfBlock,
  ], 2)

  const confidentiality = section('Confidentiality', [
    para('Each party shall keep confidential all non-public information disclosed under this mandate and shall not use it except to perform its obligations hereunder.'),
  ], 3)

  const signatures = section('Signatures', [
    signature('{{client_name}}', 'Client'),
    signature('{{advisor_name}}', 'Advisor'),
  ], 4)

  doc.sections = [parties, scope, fees, confidentiality, signatures]

  const rule: LogicRule = {
    id: generateId(),
    name: 'Show performance fee clause',
    description: 'Reveals the performance-fee paragraph when enabled.',
    enabled: true,
    priority: 0,
    conditionGroup: {
      id: generateId(),
      logic: 'AND',
      conditions: [{ id: generateId(), variableKey: 'has_performance_fee', operator: 'is_true', value: null }],
    },
    actions: [{ id: generateId(), type: 'show_block', targetId: perfBlock.id, value: null }],
  }
  doc.rules = [rule]

  return doc
}

export function buildSampleTemplateDoc(): MandateDocument {
  const doc = createDefaultDocument({ title: 'Mutual NDA (Sample)', author: '' })
  doc.metadata.description = 'A reusable mutual non-disclosure agreement template.'
  doc.metadata.tags = ['Sample']
  doc.variables = [
    variable('party_a', 'Party A', 'text', { defaultValue: '', required: true }),
    variable('party_b', 'Party B', 'text', { defaultValue: '', required: true }),
    variable('term_years', 'Term (years)', 'number', { defaultValue: 3 }),
  ]
  doc.sections = [
    section('Purpose', [
      para('This Mutual Non-Disclosure Agreement is entered into between {{party_a}} and {{party_b}} to protect confidential information exchanged between them.'),
    ], 0),
    section('Confidentiality Obligations', [
      para('Each party agrees to hold the other party’s Confidential Information in strict confidence for a period of {{term_years}} years.'),
    ], 1),
    section('Signatures', [signature('{{party_a}}', 'Authorised Signatory'), signature('{{party_b}}', 'Authorised Signatory')], 2),
  ]
  return doc
}

export function buildSampleClauses(now: string): ClauseRecord[] {
  const base = (over: Partial<ClauseRecord>): ClauseRecord => ({
    id: generateId(),
    name: '',
    description: '',
    category: 'General',
    tags: ['Sample'],
    isSample: true,
    kind: 'blocks',
    section: null,
    blocks: [],
    variables: [],
    createdAt: now,
    updatedAt: now,
    ...over,
  })

  return [
    base({
      name: 'Standard Confidentiality',
      description: 'Mutual confidentiality obligations.',
      category: 'Confidentiality',
      kind: 'section',
      section: section('Confidentiality', [
        para('Each party shall keep confidential all Confidential Information of the other party and use it solely for the purposes of this agreement.'),
      ], 0),
    }),
    base({
      name: 'Governing Law (India)',
      description: 'Indian governing law and jurisdiction.',
      category: 'Governing Law',
      kind: 'blocks',
      blocks: [para('This agreement shall be governed by and construed in accordance with the laws of India, and the courts at {{jurisdiction_city}} shall have exclusive jurisdiction.')],
      variables: [variable('jurisdiction_city', 'Jurisdiction City', 'text', { defaultValue: 'Mumbai', required: true })],
    }),
    base({
      name: 'Termination for Convenience',
      description: 'Either party may terminate on notice.',
      category: 'Term & Termination',
      kind: 'blocks',
      blocks: [para('Either party may terminate this agreement by providing {{notice_days}} days’ prior written notice to the other party.')],
      variables: [variable('notice_days', 'Notice Period (days)', 'number', { defaultValue: 30 })],
    }),
    base({
      name: 'Limitation of Liability',
      description: 'Caps aggregate liability.',
      category: 'Liability',
      kind: 'blocks',
      blocks: [para('The aggregate liability of the Advisor under this agreement shall not exceed the total fees paid by the Client in the preceding twelve (12) months.')],
    }),
    base({
      name: 'Fee Schedule',
      description: 'A fee table with base and performance components.',
      category: 'Fees & Payment',
      kind: 'section',
      section: section('Fee Schedule', [
        heading('Fee Schedule', 2),
        {
          id: generateId(),
          type: 'table',
          hidden: false,
          locked: false,
          required: false,
          columns: [
            { id: generateId(), header: 'Component' },
            { id: generateId(), header: 'Amount' },
          ],
          rows: [{ id: generateId(), cells: [] }],
        } as Block,
      ], 0),
    }),
    base({
      name: 'Signature Block (Two Parties)',
      description: 'Signature lines for two parties.',
      category: 'Signatures',
      kind: 'blocks',
      blocks: [signature('{{party_a}}', 'Authorised Signatory'), signature('{{party_b}}', 'Authorised Signatory')],
      variables: [
        variable('party_a', 'Party A', 'text', { required: true }),
        variable('party_b', 'Party B', 'text', { required: true }),
      ],
    }),
  ]
}
