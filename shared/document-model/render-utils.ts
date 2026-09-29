import type { Variable } from './types'
import { formatDate, formatCurrency } from '../utils/format'

// ---- Placeholder resolution ----

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g

/**
 * Format a resolved variable value for display, honouring its type
 * (currency → ₹, date → localized, boolean → Yes/No, list → comma-joined).
 */
export function formatVariableValue(value: unknown, variable?: Variable): string {
  if (value === null || value === undefined) return ''

  if (variable) {
    switch (variable.type) {
      case 'currency': {
        const num = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(num)) return String(value)
        const currency = variable.formatting?.currency || 'INR'
        return formatCurrency(num, currency)
      }
      case 'date':
        return formatDate(String(value))
      case 'boolean':
        return value === true || value === 'true' ? 'Yes' : 'No'
      case 'list':
        if (Array.isArray(value)) return value.join(', ')
        return String(value)
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(num)) return String(value)
        const dp = variable.formatting?.decimalPlaces
        return typeof dp === 'number' ? num.toFixed(dp) : String(num)
      }
      default:
        return String(value)
    }
  }

  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/**
 * Rewrite {{oldKey}} placeholders to {{newKey}} according to a remap.
 * Keys not present in the map are left unchanged. Whitespace inside the
 * braces is normalised away.
 */
export function rewritePlaceholderKeys(text: string, keyRemap: Record<string, string>): string {
  if (!text) return ''
  return text.replace(PLACEHOLDER_RE, (match, key: string) => {
    const next = keyRemap[key]
    return next ? `{{${next}}}` : match
  })
}

/** Extract the set of variable keys referenced by {{...}} in a string. */
export function extractPlaceholderKeys(text: string): string[] {
  if (!text) return []
  const out = new Set<string>()
  let m: RegExpExecArray | null
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')
  while ((m = re.exec(text)) !== null) out.add(m[1])
  return [...out]
}

/**
 * Replace all {{key}} placeholders in a string with their resolved,
 * type-formatted values. Unknown placeholders are left intact so the
 * validation engine can flag them.
 */
export function resolvePlaceholders(
  text: string,
  resolvedValues: Record<string, unknown>,
  variables: Variable[],
): string {
  if (!text) return ''
  const varByKey = new Map(variables.map((v) => [v.key, v]))
  return text.replace(PLACEHOLDER_RE, (match, key: string) => {
    if (!(key in resolvedValues) && !varByKey.has(key)) return match
    return formatVariableValue(resolvedValues[key], varByKey.get(key))
  })
}

// ---- Tiptap JSON → structured paragraphs ----

export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
}

export interface RenderedParagraph {
  runs: TextRun[]
  listType?: 'bullet' | 'ordered'
  listLevel?: number
  headingLevel?: number
}

interface TiptapNode {
  type?: string
  text?: string
  marks?: Array<{ type: string }>
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

function marksToRun(text: string, marks: Array<{ type: string }> = []): TextRun {
  const run: TextRun = { text }
  for (const m of marks) {
    if (m.type === 'bold') run.bold = true
    else if (m.type === 'italic') run.italic = true
    else if (m.type === 'underline') run.underline = true
    else if (m.type === 'strike') run.strike = true
  }
  return run
}

function collectRuns(node: TiptapNode): TextRun[] {
  const runs: TextRun[] = []
  const walk = (n: TiptapNode) => {
    if (n.type === 'text' && typeof n.text === 'string') {
      runs.push(marksToRun(n.text, n.marks))
      return
    }
    // A variable-placeholder chip resolves via the same {{key}} path as text.
    if (n.type === 'variablePlaceholder' && typeof n.attrs?.key === 'string') {
      runs.push({ text: `{{${n.attrs.key}}}` })
      return
    }
    if (n.type === 'hardBreak') {
      runs.push({ text: '\n' })
      return
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  if (Array.isArray(node.content)) node.content.forEach(walk)
  return runs
}

/**
 * Convert a Tiptap JSON document into a flat list of paragraphs with
 * per-run mark information. Handles paragraphs, headings, and
 * bullet/ordered lists (nested). Returns [] for empty/invalid content.
 */
export function tiptapToParagraphs(content: unknown): RenderedParagraph[] {
  if (!content || typeof content !== 'object') return []
  const doc = content as TiptapNode
  const out: RenderedParagraph[] = []

  const visit = (
    node: TiptapNode,
    listType: 'bullet' | 'ordered' | undefined,
    listLevel: number,
  ) => {
    switch (node.type) {
      case 'paragraph': {
        const runs = collectRuns(node)
        out.push(listType ? { runs, listType, listLevel } : { runs })
        break
      }
      case 'heading': {
        const runs = collectRuns(node)
        const level = typeof node.attrs?.level === 'number' ? (node.attrs.level as number) : 2
        out.push({ runs, headingLevel: level })
        break
      }
      case 'bulletList':
        node.content?.forEach((child) => visit(child, 'bullet', listLevel))
        break
      case 'orderedList':
        node.content?.forEach((child) => visit(child, 'ordered', listLevel))
        break
      case 'listItem':
        node.content?.forEach((child) => {
          if (child.type === 'bulletList' || child.type === 'orderedList') {
            visit(child, listType, listLevel + 1)
          } else {
            visit(child, listType, listLevel)
          }
        })
        break
      case 'blockquote':
      case 'doc':
        node.content?.forEach((child) => visit(child, listType, listLevel))
        break
      default:
        if (Array.isArray(node.content)) {
          node.content.forEach((child) => visit(child, listType, listLevel))
        }
    }
  }

  if (Array.isArray(doc.content)) {
    doc.content.forEach((child) => visit(child, undefined, 0))
  }
  return out
}

/** Flatten a Tiptap doc to plain text (paragraphs joined by newlines). */
export function tiptapToPlainText(content: unknown): string {
  return tiptapToParagraphs(content)
    .map((p) => p.runs.map((r) => r.text).join(''))
    .join('\n')
}

// ---- Section numbering ----

export type NumberingStyle = 'decimal' | 'alpha' | 'roman'

export function toAlpha(n: number): string {
  let s = ''
  let x = n
  while (x > 0) {
    const rem = (x - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    x = Math.floor((x - 1) / 26)
  }
  return s
}

export function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let x = n
  let s = ''
  for (const [v, sym] of map) {
    while (x >= v) {
      s += sym
      x -= v
    }
  }
  return s
}

/** Build a section number label (1-based index) for a numbering style. */
export function sectionLabel(index: number, style: NumberingStyle): string {
  const n = index + 1
  if (style === 'alpha') return `${toAlpha(n)}.`
  if (style === 'roman') return `${toRoman(n)}.`
  return `${n}.`
}
