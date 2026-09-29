import type { Variable } from 'shared/document-model/types'

/** Coerce a raw form input string to the value type a variable expects. */
export function coerceVariableValue(raw: string, type: Variable['type']): unknown {
  if (type === 'boolean') return raw === 'true'
  if (raw === '') return null
  if (type === 'number' || type === 'currency') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return raw
}

/** Convert a stored variable value back to a string for a text/select/date input. */
export function valueToInputString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/** The HTML input type to use for a variable's data-entry field. */
export function inputTypeFor(type: Variable['type']): 'text' | 'number' | 'date' {
  if (type === 'number' || type === 'currency') return 'number'
  if (type === 'date') return 'date'
  return 'text'
}
