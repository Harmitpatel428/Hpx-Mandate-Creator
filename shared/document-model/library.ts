import type { MandateDocument, Section, Block, Variable } from './types'

/** A saved template: a full document that new mandates can be created from. */
export interface TemplateRecord {
  id: string
  name: string
  description: string
  category: string
  isSample: boolean
  createdAt: string
  updatedAt: string
  content: MandateDocument
}

export type ClauseKind = 'section' | 'blocks'

/**
 * A reusable clause: either a whole section or a run of blocks, together
 * with the variable definitions it references so it can be inserted into
 * another document with variable remapping.
 */
export interface ClauseRecord {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  isSample: boolean
  kind: ClauseKind
  section: Section | null
  blocks: Block[]
  variables: Variable[]
  createdAt: string
  updatedAt: string
}

export const CLAUSE_CATEGORIES = [
  'General',
  'Fees & Payment',
  'Confidentiality',
  'Term & Termination',
  'Liability',
  'Governing Law',
  'Signatures',
] as const

export const TEMPLATE_CATEGORIES = [
  'General',
  'Advisory',
  'Engagement',
  'Retainer',
  'NDA',
] as const
