import { Parser } from 'expr-eval'

const parser = new Parser({
  operators: {
    logical: true,
    comparison: true,
    in: false,
    assignment: false,
  },
})

// Safe custom functions — no eval, no side effects
parser.functions['IF'] = (cond: unknown, a: unknown, b: unknown) => (cond ? a : b)
parser.functions['SUM'] = (...args: number[]) => args.reduce((s, v) => s + (v ?? 0), 0)
parser.functions['MIN'] = (...args: number[]) => Math.min(...args)
parser.functions['MAX'] = (...args: number[]) => Math.max(...args)
parser.functions['ROUND'] = (v: number, dp = 0) => {
  const factor = Math.pow(10, dp)
  return Math.round(v * factor) / factor
}
parser.functions['ABS'] = Math.abs
parser.functions['FLOOR'] = Math.floor
parser.functions['CEIL'] = Math.ceil

export interface FormulaValidation {
  valid: boolean
  error?: string
}

export function validateFormula(formula: string): FormulaValidation {
  try {
    parser.parse(formula)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export function evaluateFormula(
  formula: string,
  variables: Record<string, unknown>,
): number | string | boolean {
  const expr = parser.parse(formula)
  const safeVars: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(variables)) {
    safeVars[k] = v ?? 0
  }
  return expr.evaluate(safeVars as Record<string, number>)
}

export function getFormulaVariableRefs(formula: string): string[] {
  try {
    return parser.parse(formula).variables()
  } catch {
    return []
  }
}
