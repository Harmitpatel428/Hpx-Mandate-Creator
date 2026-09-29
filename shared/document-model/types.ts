import { z } from 'zod'
import {
  DocumentSchema,
  DocumentMetadataSchema,
  PageSettingsSchema,
  DocumentStylesSchema,
  VariableSchema,
  VariableTypeSchema,
  PartySchema,
  BlockSchema,
  SectionSchema,
  LogicRuleSchema,
  VersionMetadataSchema,
  ExportSettingsSchema,
  DocumentStatusSchema,
  ConfidentialitySchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  TableBlockSchema,
  SignatureBlockSchema,
} from './schema'

export type MandateDocument = z.infer<typeof DocumentSchema>
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>
export type PageSettings = z.infer<typeof PageSettingsSchema>
export type DocumentStyles = z.infer<typeof DocumentStylesSchema>
export type Variable = z.infer<typeof VariableSchema>
export type VariableType = z.infer<typeof VariableTypeSchema>
export type Party = z.infer<typeof PartySchema>
export type Block = z.infer<typeof BlockSchema>
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>
export type TableBlock = z.infer<typeof TableBlockSchema>
export type SignatureBlock = z.infer<typeof SignatureBlockSchema>
export type Section = z.infer<typeof SectionSchema>
export type LogicRule = z.infer<typeof LogicRuleSchema>
export type VersionMetadata = z.infer<typeof VersionMetadataSchema>
export type ExportSettings = z.infer<typeof ExportSettingsSchema>
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>
export type Confidentiality = z.infer<typeof ConfidentialitySchema>

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error'

export const PROJECT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs Review',
  ready_to_export: 'Ready to Export',
  final: 'Final',
  archived: 'Archived',
}
