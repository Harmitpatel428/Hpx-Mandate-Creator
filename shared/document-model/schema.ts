import { z } from 'zod'

// ---- Primitives ----

export const DocumentStatusSchema = z.enum([
  'draft',
  'needs_review',
  'ready_to_export',
  'final',
  'archived',
])

export const PageSizeSchema = z.enum(['A4', 'Letter', 'Legal'])

export const ConfidentialitySchema = z.enum([
  'public',
  'internal',
  'confidential',
  'strictly_confidential',
])

// ---- Sub-schemas ----

export const DocumentMetadataSchema = z.object({
  title: z.string().min(1).max(500).default('Untitled Mandate'),
  author: z.string().max(200).default(''),
  organization: z.string().max(200).default(''),
  status: DocumentStatusSchema.default('draft'),
  effectiveDate: z.string().nullable().default(null),
  expiryDate: z.string().nullable().default(null),
  confidentiality: ConfidentialitySchema.default('confidential'),
  documentNumber: z.string().max(100).default(''),
  description: z.string().max(2000).default(''),
  language: z.string().default('en'),
  tags: z.array(z.string().max(50)).default([]),
})

export const MarginsSchema = z.object({
  top: z.number().min(0).max(200).default(25),
  right: z.number().min(0).max(200).default(25),
  bottom: z.number().min(0).max(200).default(25),
  left: z.number().min(0).max(200).default(25),
  unit: z.enum(['mm', 'pt', 'in']).default('mm'),
})

export const PageSettingsSchema = z.object({
  pageSize: PageSizeSchema.default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  margins: MarginsSchema.default({}),
  showHeader: z.boolean().default(false),
  showFooter: z.boolean().default(false),
  showPageNumbers: z.boolean().default(true),
})

export const DocumentStylesSchema = z.object({
  fontFamily: z
    .string()
    .default(
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif',
    ),
  baseFontSize: z.number().min(6).max(72).default(11),
  headingScale: z.number().min(1).max(3).default(1.25),
  lineSpacing: z.number().min(1).max(3).default(1.5),
  primaryColor: z.string().default('#1d4ed8'),
  tableStyle: z.enum(['plain', 'bordered', 'striped', 'minimal']).default('bordered'),
  numberingStyle: z.enum(['decimal', 'alpha', 'roman']).default('decimal'),
})

// ---- Variables ----

export const VariableTypeSchema = z.enum([
  'text',
  'long-text',
  'number',
  'currency',
  'date',
  'boolean',
  'select',
  'party',
  'list',
  'calculated',
])

export const VariableSchema = z.object({
  id: z.string(),
  key: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Variable key must be a valid identifier'),
  label: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  type: VariableTypeSchema,
  defaultValue: z.unknown().default(null),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  formula: z.string().optional(),
  formatting: z
    .object({
      currency: z.string().optional(),
      dateFormat: z.string().optional(),
      decimalPlaces: z.number().int().min(0).max(10).optional(),
    })
    .optional(),
})

// ---- Parties ----

export const PartySchema = z.object({
  id: z.string(),
  role: z.string().min(1).max(100),
  legalName: z.string().default(''),
  registrationNumber: z.string().default(''),
  address: z.string().default(''),
  representativeName: z.string().default(''),
  representativeTitle: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  customFields: z.record(z.string(), z.string()).default({}),
})

// ---- Blocks ----

export const BlockTypeSchema = z.enum([
  'heading',
  'paragraph',
  'plain-text',
  'date-field',
  'table',
  'party',
  'signature',
  'definition-list',
  'annex-ref',
  'page-break',
  'conditional-container',
  'calculated-field',
  'clause-insert',
  'note',
])

export const BaseBlockSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  locked: z.boolean().default(false),
  required: z.boolean().default(false),
  conditionalRef: z.string().optional(),
})

export const HeadingBlockSchema = BaseBlockSchema.extend({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  content: z.string().default(''),
})

export const ParagraphBlockSchema = BaseBlockSchema.extend({
  type: z.literal('paragraph'),
  content: z.string().default(''),
})

export const PlainTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('plain-text'),
  content: z.string().default(''),
  label: z.string().default(''),
})

export const PageBreakBlockSchema = BaseBlockSchema.extend({
  type: z.literal('page-break'),
})

export const NoteBlockSchema = BaseBlockSchema.extend({
  type: z.literal('note'),
  content: z.string().default(''),
  noteType: z.enum(['info', 'warning', 'internal']).default('internal'),
})

export const SignatureBlockSchema = BaseBlockSchema.extend({
  type: z.literal('signature'),
  partyId: z.string().optional(),
  signatoryName: z.string().default(''),
  signatoryTitle: z.string().default(''),
  showDateLine: z.boolean().default(true),
  showPlaceLine: z.boolean().default(false),
})

export const TableColumnSchema = z.object({
  id: z.string(),
  header: z.string().default(''),
  width: z.number().optional(),
})

export const TableCellSchema = z.object({
  colId: z.string(),
  content: z.string().default(''),
})

export const TableRowSchema = z.object({
  id: z.string(),
  cells: z.array(TableCellSchema).default([]),
})

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('table'),
  columns: z.array(TableColumnSchema).default([]),
  rows: z.array(TableRowSchema).default([]),
})

export const BlockSchema = z.discriminatedUnion('type', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  PlainTextBlockSchema,
  PageBreakBlockSchema,
  NoteBlockSchema,
  SignatureBlockSchema,
  TableBlockSchema,
  // Phase 2+ types — stored as unknown but typed for discriminator
  BaseBlockSchema.extend({ type: z.literal('date-field'), content: z.string().default('') }),
  BaseBlockSchema.extend({ type: z.literal('party'), partyId: z.string().optional(), content: z.string().default('') }),
  BaseBlockSchema.extend({ type: z.literal('definition-list'), content: z.string().default('') }),
  BaseBlockSchema.extend({ type: z.literal('annex-ref'), annexId: z.string().optional() }),
  BaseBlockSchema.extend({ type: z.literal('conditional-container'), ruleRef: z.string().optional(), children: z.array(z.string()).default([]) }),
  BaseBlockSchema.extend({ type: z.literal('calculated-field'), variableRef: z.string().optional() }),
  BaseBlockSchema.extend({ type: z.literal('clause-insert'), clauseId: z.string().optional() }),
])

// ---- Sections ----

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string().max(300).default(''),
  numbering: z.boolean().default(true),
  hidden: z.boolean().default(false),
  locked: z.boolean().default(false),
  required: z.boolean().default(false),
  conditionalRef: z.string().optional(),
  blocks: z.array(BlockSchema).default([]),
  order: z.number().int().min(0).default(0),
})

// ---- Logic rules (Phase 1: minimal stubs) ----

export const ConditionSchema = z.object({
  id: z.string(),
  variableKey: z.string().default(''),
  operator: z
    .enum([
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'contains',
      'is_empty',
      'is_not_empty',
      'is_true',
      'is_false',
    ])
    .default('equals'),
  value: z.unknown().default(null),
})

export const ConditionGroupSchema = z.object({
  id: z.string(),
  logic: z.enum(['AND', 'OR']).default('AND'),
  conditions: z.array(ConditionSchema).default([]),
})

export const RuleActionSchema = z.object({
  id: z.string(),
  type: z
    .enum([
      'show_block',
      'hide_block',
      'show_section',
      'hide_section',
      'set_variable',
      'mark_required',
      'mark_optional',
    ])
    .default('show_block'),
  targetId: z.string().default(''),
  value: z.unknown().default(null),
})

export const LogicRuleSchema = z.object({
  id: z.string(),
  name: z.string().max(200).default(''),
  description: z.string().max(500).default(''),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  conditionGroup: ConditionGroupSchema,
  actions: z.array(RuleActionSchema).default([]),
})

// ---- Version metadata ----

export const VersionMetadataSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  createdAt: z.string(),
  updatedAt: z.string(),
  revisionNumber: z.number().int().min(0).default(0),
  isFinal: z.boolean().default(false),
  snapshotLabel: z.string().default(''),
})

// ---- Export settings ----

export const ExportSettingsSchema = z.object({
  includeDraftWatermark: z.boolean().default(true),
  includeAnnexes: z.boolean().default(true),
  includeInternalNotes: z.boolean().default(false),
  pageSize: PageSizeSchema.default('A4'),
})

// ---- Root document ----

export const DocumentSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  id: z.string(),
  metadata: DocumentMetadataSchema,
  pageSettings: PageSettingsSchema.default({}),
  styles: DocumentStylesSchema.default({}),
  variables: z.array(VariableSchema).default([]),
  variableValues: z.record(z.string(), z.unknown()).default({}),
  parties: z.array(PartySchema).default([]),
  sections: z.array(SectionSchema).default([]),
  rules: z.array(LogicRuleSchema).default([]),
  validationRules: z.array(z.unknown()).default([]),
  versionMetadata: VersionMetadataSchema,
  exportSettings: ExportSettingsSchema.default({}),
})
