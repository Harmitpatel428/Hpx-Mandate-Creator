import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageOrientation,
  convertMillimetersToTwip,
  convertInchesToTwip,
  AlignmentType,
  LevelFormat,
  type ISectionOptions,
  type IParagraphOptions,
  type ParagraphChild,
} from 'docx'
import type { MandateDocument, Block, PageSize } from 'shared/document-model/types'
import { resolveDocument } from 'shared/logic-engine/resolver'
import {
  tiptapToParagraphs,
  resolvePlaceholders,
  sectionLabel,
  type RenderedParagraph,
  type NumberingStyle,
} from 'shared/document-model/render-utils'

const PAGE_SIZES_TWIP: Record<string, { w: number; h: number }> = {
  A4: { w: convertMillimetersToTwip(210), h: convertMillimetersToTwip(297) },
  Letter: { w: convertInchesToTwip(8.5), h: convertInchesToTwip(11) },
  Legal: { w: convertInchesToTwip(8.5), h: convertInchesToTwip(14) },
}

function marginToTwip(value: number, unit: string): number {
  if (unit === 'in') return convertInchesToTwip(value)
  if (unit === 'pt') return Math.round(value * 20)
  return convertMillimetersToTwip(value)
}

function runsFromParagraph(
  para: RenderedParagraph,
  values: Record<string, unknown>,
  variables: MandateDocument['variables'],
): ParagraphChild[] {
  const out: ParagraphChild[] = []
  for (const r of para.runs) {
    if (r.text === '\n') {
      out.push(new TextRun({ break: 1 }))
      continue
    }
    out.push(
      new TextRun({
        text: resolvePlaceholders(r.text, values, variables),
        bold: r.bold,
        italics: r.italic,
        underline: r.underline ? {} : undefined,
        strike: r.strike,
      }),
    )
  }
  return out
}

function headingLevelFor(level?: number) {
  if (level === 1) return HeadingLevel.HEADING_1
  if (level === 3) return HeadingLevel.HEADING_3
  return HeadingLevel.HEADING_2
}

function blockToParagraphs(
  block: Block,
  values: Record<string, unknown>,
  variables: MandateDocument['variables'],
  includeInternalNotes: boolean,
): (Paragraph | Table)[] {
  switch (block.type) {
    case 'heading': {
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      if (!text.trim()) return []
      return [new Paragraph({ text, heading: headingLevelFor(block.level) })]
    }
    case 'paragraph': {
      const paras = tiptapToParagraphs(block.content)
      return paras.map((p) => {
        const opts: IParagraphOptions = {
          children: runsFromParagraph(p, values, variables),
          ...(p.headingLevel ? { heading: headingLevelFor(p.headingLevel) } : {}),
          ...(p.listType === 'bullet' ? { bullet: { level: p.listLevel ?? 0 } } : {}),
          ...(p.listType === 'ordered'
            ? { numbering: { reference: 'ordered-list', level: p.listLevel ?? 0 } }
            : {}),
        }
        return new Paragraph(opts)
      })
    }
    case 'plain-text': {
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      if (!text.trim()) return []
      return [new Paragraph({ children: [new TextRun(text)] })]
    }
    case 'note': {
      if (block.noteType === 'internal' && !includeInternalNotes) return []
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      if (!text.trim()) return []
      return [
        new Paragraph({
          children: [new TextRun({ text, italics: true })],
          shading: { fill: block.noteType === 'warning' ? 'FFFBEB' : 'EFF6FF' },
          spacing: { before: 60, after: 60 },
        }),
      ]
    }
    case 'signature': {
      const name = resolvePlaceholders(block.signatoryName ?? '', values, variables)
      const title = resolvePlaceholders(block.signatoryTitle ?? '', values, variables)
      const out: Paragraph[] = [
        new Paragraph({ text: '', spacing: { before: 240 } }),
        new Paragraph({ text: '____________________________________' }),
      ]
      if (name) out.push(new Paragraph({ children: [new TextRun({ text: name, bold: true })] }))
      if (title) out.push(new Paragraph({ children: [new TextRun({ text: title })] }))
      const meta: string[] = []
      if (block.showDateLine) meta.push('Date: _____________________')
      if (block.showPlaceLine) meta.push('Place: _____________________')
      if (meta.length) out.push(new Paragraph({ children: [new TextRun({ text: meta.join('    ') })] }))
      return out
    }
    case 'table': {
      if (block.columns.length === 0) return []
      const border = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' }
      const borders = { top: border, bottom: border, left: border, right: border }
      const headerRow = new TableRow({
        tableHeader: true,
        children: block.columns.map(
          (c) =>
            new TableCell({
              borders,
              shading: { fill: 'F9FAFB' },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: resolvePlaceholders(c.header ?? '', values, variables), bold: true })],
                }),
              ],
            }),
        ),
      })
      const bodyRows = block.rows.map(
        (row) =>
          new TableRow({
            children: block.columns.map((c) => {
              const cell = row.cells.find((cc) => cc.colId === c.id)
              return new TableCell({
                borders,
                children: [new Paragraph({ text: resolvePlaceholders(cell?.content ?? '', values, variables) })],
              })
            }),
          }),
      )
      return [
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
        new Paragraph({ text: '' }),
      ]
    }
    case 'page-break':
      return [new Paragraph({ children: [], pageBreakBefore: true })]
    default:
      return []
  }
}

export interface DocxExportOptions {
  pageSize?: PageSize
}

/** Build a .docx Buffer from a mandate document. Only visible blocks/sections are exported. */
export async function generateDocxBuffer(
  doc: MandateDocument,
  options: DocxExportOptions = {},
): Promise<Buffer> {
  const resolved = resolveDocument(doc)
  const numberingStyle = (doc.styles.numberingStyle || 'decimal') as NumberingStyle
  const includeInternalNotes = doc.exportSettings.includeInternalNotes

  const children: (Paragraph | Table)[] = []

  // Title block
  children.push(
    new Paragraph({
      children: [new TextRun({ text: doc.metadata.title || 'Untitled Mandate', bold: true, size: 40 })],
      spacing: { after: 120 },
    }),
  )
  if (doc.metadata.description) {
    children.push(new Paragraph({ children: [new TextRun({ text: doc.metadata.description, color: '6B7280' })] }))
  }
  const meta = [doc.metadata.author, doc.metadata.organization].filter(Boolean).join(' · ')
  if (meta) children.push(new Paragraph({ children: [new TextRun({ text: meta, color: '6B7280', size: 18 })] }))
  if (doc.metadata.documentNumber) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Ref: ${doc.metadata.documentNumber}`, color: '6B7280', size: 18 })] }),
    )
  }
  children.push(new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 8 } } }))

  // Sections (visible only)
  const visibleSections = resolved.sections.filter((rs) => rs.visible)
  visibleSections.forEach((rs, idx) => {
    if (rs.section.title) {
      const prefix = rs.section.numbering ? `${sectionLabel(idx, numberingStyle)} ` : ''
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: `${prefix}${rs.section.title}`, bold: true })],
        }),
      )
    }
    for (const rb of rs.blocks) {
      if (!rb.visible) continue
      children.push(...blockToParagraphs(rb.block, resolved.resolvedValues, doc.variables, includeInternalNotes))
    }
  })

  const sizeKey = options.pageSize || doc.pageSettings.pageSize || 'A4'
  const dims = PAGE_SIZES_TWIP[sizeKey] ?? PAGE_SIZES_TWIP.A4
  const orientation =
    doc.pageSettings.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
  const m = doc.pageSettings.margins

  const section: ISectionOptions = {
    properties: {
      page: {
        size: {
          width: orientation === PageOrientation.LANDSCAPE ? dims.h : dims.w,
          height: orientation === PageOrientation.LANDSCAPE ? dims.w : dims.h,
          orientation,
        },
        margin: {
          top: marginToTwip(m.top, m.unit),
          right: marginToTwip(m.right, m.unit),
          bottom: marginToTwip(m.bottom, m.unit),
          left: marginToTwip(m.left, m.unit),
        },
      },
    },
    children,
  }

  const document = new Document({
    creator: doc.metadata.author || 'Master Mandate Creator',
    title: doc.metadata.title,
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.', alignment: AlignmentType.START },
            { level: 2, format: LevelFormat.LOWER_ROMAN, text: '%3.', alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [section],
  })

  return Packer.toBuffer(document)
}
