import { describe, it, expect } from 'vitest'
import {
  resolvePlaceholders,
  formatVariableValue,
  tiptapToParagraphs,
  tiptapToPlainText,
  sectionLabel,
  toAlpha,
  toRoman,
} from '../shared/document-model/render-utils'
import type { Variable } from '../shared/document-model/types'

function v(key: string, type: Variable['type'], extra: Partial<Variable> = {}): Variable {
  return { id: key, key, label: key, description: '', type, defaultValue: null, required: false, ...extra }
}

describe('resolvePlaceholders', () => {
  const vars = [v('client', 'text'), v('fee', 'currency')]

  it('replaces known placeholders with formatted values', () => {
    const out = resolvePlaceholders('Dear {{client}}, fee is {{fee}}.', { client: 'Acme', fee: 50000 }, vars)
    expect(out).toContain('Dear Acme')
    expect(out).toContain('₹') // INR currency symbol
    expect(out).toContain('50,000')
  })

  it('leaves unknown placeholders intact', () => {
    const out = resolvePlaceholders('Hi {{missing}}', {}, vars)
    expect(out).toBe('Hi {{missing}}')
  })

  it('handles whitespace inside braces', () => {
    const out = resolvePlaceholders('X {{ client }} Y', { client: 'Z' }, vars)
    expect(out).toBe('X Z Y')
  })
})

describe('formatVariableValue', () => {
  it('formats currency in INR', () => {
    expect(formatVariableValue(1000, v('a', 'currency'))).toContain('₹')
  })
  it('formats boolean as Yes/No', () => {
    expect(formatVariableValue(true, v('a', 'boolean'))).toBe('Yes')
    expect(formatVariableValue('false', v('a', 'boolean'))).toBe('No')
  })
  it('joins list values', () => {
    expect(formatVariableValue(['a', 'b'], v('a', 'list'))).toBe('a, b')
  })
  it('returns empty string for null/undefined', () => {
    expect(formatVariableValue(null)).toBe('')
    expect(formatVariableValue(undefined)).toBe('')
  })
})

describe('tiptapToParagraphs', () => {
  it('returns [] for empty content', () => {
    expect(tiptapToParagraphs(null)).toEqual([])
    expect(tiptapToParagraphs({})).toEqual([])
  })

  it('parses paragraphs with marks', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello ', marks: [] }, { type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ],
    }
    const paras = tiptapToParagraphs(doc)
    expect(paras).toHaveLength(1)
    expect(paras[0].runs).toHaveLength(2)
    expect(paras[0].runs[1].bold).toBe(true)
  })

  it('parses bullet lists', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
          ],
        },
      ],
    }
    const paras = tiptapToParagraphs(doc)
    expect(paras).toHaveLength(2)
    expect(paras[0].listType).toBe('bullet')
  })

  it('flattens to plain text', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'line1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'line2' }] },
      ],
    }
    expect(tiptapToPlainText(doc)).toBe('line1\nline2')
  })

  it('emits {{key}} for variablePlaceholder chip nodes so they resolve', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'variablePlaceholder', attrs: { key: 'client', label: 'Client' } },
            { type: 'text', text: '!' },
          ],
        },
      ],
    }
    const paras = tiptapToParagraphs(doc)
    const text = paras[0].runs.map((r) => r.text).join('')
    expect(text).toBe('Hello {{client}}!')
    // And it resolves through resolvePlaceholders
    const resolved = resolvePlaceholders(text, { client: 'Acme' }, [v('client', 'text')])
    expect(resolved).toBe('Hello Acme!')
  })
})

describe('section numbering', () => {
  it('decimal', () => {
    expect(sectionLabel(0, 'decimal')).toBe('1.')
    expect(sectionLabel(9, 'decimal')).toBe('10.')
  })
  it('alpha', () => {
    expect(toAlpha(1)).toBe('A')
    expect(toAlpha(26)).toBe('Z')
    expect(toAlpha(27)).toBe('AA')
    expect(sectionLabel(0, 'alpha')).toBe('A.')
  })
  it('roman', () => {
    expect(toRoman(4)).toBe('IV')
    expect(toRoman(9)).toBe('IX')
    expect(sectionLabel(3, 'roman')).toBe('IV.')
  })
})
