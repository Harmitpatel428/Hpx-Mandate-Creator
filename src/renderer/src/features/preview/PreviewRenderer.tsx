import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { resolveDocument } from 'shared/logic-engine/resolver'
import {
  tiptapToParagraphs,
  resolvePlaceholders,
  sectionLabel,
  type RenderedParagraph,
  type TextRun,
  type NumberingStyle,
} from 'shared/document-model/render-utils'
import type { MandateDocument, Block, Variable } from 'shared/document-model/types'
import '@/styles/print.css'

const READY_SIGNAL = 'EXPORT_READY'

interface Props {
  projectId: string
  isExport: boolean
}

// ---- run rendering ----

function RunSpan({ run }: { run: TextRun }) {
  if (run.text === '\n') return <br />
  const style: React.CSSProperties = {}
  if (run.bold) style.fontWeight = 700
  if (run.italic) style.fontStyle = 'italic'
  const deco: string[] = []
  if (run.underline) deco.push('underline')
  if (run.strike) deco.push('line-through')
  if (deco.length) style.textDecoration = deco.join(' ')
  return <span style={style}>{run.text}</span>
}

function resolveRuns(
  runs: TextRun[],
  values: Record<string, unknown>,
  variables: Variable[],
): TextRun[] {
  return runs.map((r) =>
    r.text === '\n' ? r : { ...r, text: resolvePlaceholders(r.text, values, variables) },
  )
}

function ParagraphRuns({
  para,
  values,
  variables,
}: {
  para: RenderedParagraph
  values: Record<string, unknown>
  variables: Variable[]
}) {
  const runs = resolveRuns(para.runs, values, variables)
  return (
    <>
      {runs.map((r, i) => (
        <RunSpan key={i} run={r} />
      ))}
    </>
  )
}

// ---- block rendering ----

function BlockView({
  block,
  values,
  variables,
  includeInternalNotes,
}: {
  block: Block
  values: Record<string, unknown>
  variables: Variable[]
  includeInternalNotes: boolean
}) {
  switch (block.type) {
    case 'heading': {
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      const cls = block.level === 1 ? 'preview-h1' : block.level === 3 ? 'preview-h3' : 'preview-h2'
      const Tag = (`h${block.level ?? 2}`) as keyof JSX.IntrinsicElements
      return <Tag className={`preview-block ${cls}`}>{text}</Tag>
    }
    case 'paragraph': {
      const paras = tiptapToParagraphs(block.content)
      if (paras.length === 0) return null
      const out: React.ReactNode[] = []
      let i = 0
      while (i < paras.length) {
        const p = paras[i]
        if (p.listType) {
          const listType = p.listType
          const items: RenderedParagraph[] = []
          while (i < paras.length && paras[i].listType === listType) {
            items.push(paras[i])
            i++
          }
          const ListTag = listType === 'ordered' ? 'ol' : 'ul'
          out.push(
            <ListTag key={`l-${i}`} className="preview-block preview-list">
              {items.map((it, j) => (
                <li key={j}>
                  <ParagraphRuns para={it} values={values} variables={variables} />
                </li>
              ))}
            </ListTag>,
          )
          continue
        }
        if (p.headingLevel) {
          const cls = p.headingLevel === 1 ? 'preview-h1' : p.headingLevel >= 3 ? 'preview-h3' : 'preview-h2'
          out.push(
            <p key={`h-${i}`} className={`preview-block ${cls}`}>
              <ParagraphRuns para={p} values={values} variables={variables} />
            </p>,
          )
          i++
          continue
        }
        out.push(
          <p key={`p-${i}`} className="preview-block preview-p">
            <ParagraphRuns para={p} values={values} variables={variables} />
          </p>,
        )
        i++
      }
      return <>{out}</>
    }
    case 'plain-text': {
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      if (!text.trim()) return null
      return <p className="preview-block preview-p">{text}</p>
    }
    case 'note': {
      if (block.noteType === 'internal' && !includeInternalNotes) return null
      const text = resolvePlaceholders(block.content ?? '', values, variables)
      if (!text.trim()) return null
      const cls = block.noteType === 'warning' ? 'preview-note is-warning' : 'preview-note'
      return <div className={`preview-block ${cls}`}>{text}</div>
    }
    case 'signature': {
      const name = resolvePlaceholders(block.signatoryName ?? '', values, variables)
      const title = resolvePlaceholders(block.signatoryTitle ?? '', values, variables)
      return (
        <div className="preview-block preview-signature">
          <div className="preview-sig-line" />
          {name && <div className="preview-sig-name">{name}</div>}
          {title && <div className="preview-sig-title">{title}</div>}
          <div className="preview-sig-meta">
            {block.showDateLine && <span>Date: _____________________</span>}
            {block.showDateLine && block.showPlaceLine && <span>{'   '}</span>}
            {block.showPlaceLine && <span>Place: _____________________</span>}
          </div>
        </div>
      )
    }
    case 'table': {
      if (block.columns.length === 0) return null
      return (
        <table className="preview-block preview-table">
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c.id}>{resolvePlaceholders(c.header ?? '', values, variables)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.id}>
                {block.columns.map((c) => {
                  const cell = row.cells.find((cc) => cc.colId === c.id)
                  return <td key={c.id}>{resolvePlaceholders(cell?.content ?? '', values, variables)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    case 'page-break':
      return <hr className="preview-page-break" />
    default:
      return null
  }
}

// ---- dynamic page style ----

const PAGE_DIMS_MM: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
}

function buildPageStyle(doc: MandateDocument, overridePageSize?: string): string {
  const size = overridePageSize || doc.pageSettings.pageSize || 'A4'
  const orientation = doc.pageSettings.orientation || 'portrait'
  const dims = PAGE_DIMS_MM[size] ?? PAGE_DIMS_MM.A4
  const widthMm = orientation === 'landscape' ? dims.h : dims.w
  const m = doc.pageSettings.margins
  const unit = m.unit || 'mm'
  const marginCss = `${m.top}${unit} ${m.right}${unit} ${m.bottom}${unit} ${m.left}${unit}`
  return `
    @page { size: ${size} ${orientation}; margin: ${marginCss}; }
    .preview-page {
      width: ${widthMm}mm;
      padding: ${marginCss};
      font-family: ${doc.styles.fontFamily};
      font-size: ${doc.styles.baseFontSize}pt;
    }
  `
}

// ---- main component ----

export function PreviewRenderer({ projectId, isExport }: Props) {
  const [doc, setDoc] = useState<MandateDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [overridePageSize, setOverridePageSize] = useState<string | undefined>(undefined)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    const ps = params.get('pageSize')
    if (ps) setOverridePageSize(ps)

    let cancelled = false
    window.electronAPI.projects
      .get({ id: projectId })
      .then((res) => {
        if (cancelled) return
        if (res.success) setDoc(res.data.content)
        else setError(res.error)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const resolved = useMemo(() => (doc ? resolveDocument(doc) : null), [doc])

  // Signal readiness for the PDF exporter once content is painted.
  useEffect(() => {
    if (resolved) {
      // Two RAFs ensure layout + paint have flushed before we signal.
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.title = READY_SIGNAL
        }),
      )
      return () => cancelAnimationFrame(raf)
    }
    if (error) {
      document.title = 'EXPORT_ERROR'
    }
    return undefined
  }, [resolved, error])

  if (error) {
    return (
      <div className="preview-root" style={{ padding: 40 }}>
        <p style={{ color: '#dc2626' }}>Preview error: {error}</p>
      </div>
    )
  }

  if (!doc || !resolved) {
    return (
      <div className="preview-root" style={{ padding: 40 }}>
        <p style={{ color: '#6b7280' }}>Loading preview…</p>
      </div>
    )
  }

  const pageStyle = buildPageStyle(doc, overridePageSize)
  const numberingStyle = (doc.styles.numberingStyle || 'decimal') as NumberingStyle
  const showWatermark =
    doc.exportSettings.includeDraftWatermark && doc.metadata.status !== 'final'
  const includeInternalNotes = doc.exportSettings.includeInternalNotes

  const visibleSections = resolved.sections.filter((rs) => rs.visible)

  return (
    <div className={`preview-root${isExport ? ' is-export' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      {showWatermark && <div className="preview-watermark">DRAFT</div>}
      <div className="preview-page">
        <header className="preview-doc-header">
          <h1 className="preview-doc-title">{doc.metadata.title || 'Untitled Mandate'}</h1>
          {doc.metadata.description && <p className="preview-doc-desc">{doc.metadata.description}</p>}
          {(doc.metadata.author || doc.metadata.organization) && (
            <p className="preview-doc-meta">
              {[doc.metadata.author, doc.metadata.organization].filter(Boolean).join(' · ')}
            </p>
          )}
          {doc.metadata.documentNumber && (
            <p className="preview-doc-meta">Ref: {doc.metadata.documentNumber}</p>
          )}
        </header>

        {visibleSections.map((rs, idx) => (
          <section key={rs.section.id} className="preview-section">
            {rs.section.title && (
              <h2 className="preview-section-title">
                {rs.section.numbering && (
                  <span className="preview-section-num">{sectionLabel(idx, numberingStyle)}</span>
                )}
                {rs.section.title}
              </h2>
            )}
            {rs.blocks
              .filter((rb) => rb.visible)
              .map((rb) => (
                <BlockView
                  key={rb.block.id}
                  block={rb.block}
                  values={resolved.resolvedValues}
                  variables={doc.variables}
                  includeInternalNotes={includeInternalNotes}
                />
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}

export { READY_SIGNAL }
