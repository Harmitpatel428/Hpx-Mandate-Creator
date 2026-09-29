import type { MandateDocument, Section, Block } from './types'
import { generateId } from '../utils/id'

export function patchDocument(
  doc: MandateDocument,
  patch: Partial<MandateDocument>,
): MandateDocument {
  return {
    ...doc,
    ...patch,
    versionMetadata: {
      ...doc.versionMetadata,
      ...(patch.versionMetadata ?? {}),
      updatedAt: new Date().toISOString(),
    },
  }
}

export function addSection(doc: MandateDocument, partial?: Partial<Section>): MandateDocument {
  const section: Section = {
    id: generateId(),
    title: '',
    numbering: true,
    hidden: false,
    locked: false,
    required: false,
    blocks: [],
    order: doc.sections.length,
    ...partial,
  }
  return patchDocument(doc, { sections: [...doc.sections, section] })
}

export function removeSection(doc: MandateDocument, sectionId: string): MandateDocument {
  return patchDocument(doc, {
    sections: doc.sections.filter((s) => s.id !== sectionId),
  })
}

export function updateSection(
  doc: MandateDocument,
  sectionId: string,
  patch: Partial<Section>,
): MandateDocument {
  return patchDocument(doc, {
    sections: doc.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
  })
}

export function addBlock(
  doc: MandateDocument,
  sectionId: string,
  block: Block,
): MandateDocument {
  return patchDocument(doc, {
    sections: doc.sections.map((s) =>
      s.id === sectionId ? { ...s, blocks: [...s.blocks, block] } : s,
    ),
  })
}

export function removeBlock(
  doc: MandateDocument,
  sectionId: string,
  blockId: string,
): MandateDocument {
  return patchDocument(doc, {
    sections: doc.sections.map((s) =>
      s.id === sectionId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s,
    ),
  })
}

export function reorderSections(doc: MandateDocument, orderedIds: string[]): MandateDocument {
  const byId = new Map(doc.sections.map((s) => [s.id, s]))
  const reordered = orderedIds
    .map((id, index) => {
      const s = byId.get(id)
      return s ? { ...s, order: index } : null
    })
    .filter((s): s is Section => s !== null)
  return patchDocument(doc, { sections: reordered })
}
