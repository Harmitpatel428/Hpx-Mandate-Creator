import type { MandateDocument } from './types'
import { generateId } from '../utils/id'

export function createDefaultDocument(overrides?: {
  id?: string
  title?: string
  author?: string
}): MandateDocument {
  const now = new Date().toISOString()
  const id = overrides?.id ?? generateId()

  return {
    schemaVersion: '1.0.0',
    id,
    metadata: {
      title: overrides?.title ?? 'Untitled Mandate',
      author: overrides?.author ?? '',
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
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif',
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
  }
}
