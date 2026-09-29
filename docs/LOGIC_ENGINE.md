# Logic Engine

The logic engine (`shared/logic-engine`) turns a raw document into a **resolved**
document: calculated variables are evaluated, rules are applied, and every section and
block gets computed `visible` and `required` flags. It is deterministic and pure — the
same input always produces the same output — and is used by the editor, the preview, and
both exporters.

## Modules

| Module | Responsibility |
|---|---|
| `calculator.ts` | Safe formula evaluation via `expr-eval` (no `eval`). |
| `cycle-detector.ts` | Dependency graph + topological sort (Kahn's algorithm). |
| `evaluator.ts` | Condition and condition-group evaluation. |
| `resolver.ts` | Orchestrates the full resolution pass. |

## Calculated variables

A variable of type `calculated` carries a `formula` string that references other
variable keys, e.g. `base_fee + (base_fee * performance_pct / 100)`.

- Formulas are parsed and evaluated with `expr-eval`'s `Parser`.
- Supported helper functions: `IF`, `SUM`, `MIN`, `MAX`, `ROUND`, `ABS`, `FLOOR`,
  `CEIL`.
- `validateFormula` reports parse errors; `getFormulaVariableRefs` extracts referenced
  identifiers.

## Dependency ordering & cycles

Before evaluation, calculated variables are sorted topologically so each formula only
depends on already-computed values.

- `buildDependencyGraph` builds edges from each calculated variable to the variables its
  formula references.
- `topologicalSort` (Kahn's algorithm) returns a safe evaluation order, or throws
  `CyclicDependencyError` (carrying the offending cycle path) when a cycle exists.
- `detectCycles` returns all cycles without throwing, for validation reporting.

If a cycle is present, the resolver flags `hasCyclicDependency` and falls back to a
best-effort order rather than crashing.

## Conditions

A `Condition` is `{ variableKey, operator, value }`. Supported operators:

`equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `is_empty`,
`is_not_empty`, `is_true`, `is_false`.

String/number coercion is applied so `"42"` and `42` compare equal. A `ConditionGroup`
combines conditions with `AND` or `OR`; an empty group is always true.
`conditionGroupToEnglish` renders a plain-English summary for the rule editor.

## Rules

A `LogicRule` has an `enabled` flag, a `priority`, a `conditionGroup`, and a list of
`actions`. Rules are applied in descending priority order; a rule fires only when its
condition group evaluates true against the resolved values.

Action types: `show_block`, `hide_block`, `show_section`, `hide_section`,
`set_variable`, `mark_required`, `mark_optional`.

## The resolution pass (`resolveDocument`)

1. Merge variable values (overrides → stored values → defaults).
2. Topologically sort and evaluate calculated variables.
3. Seed section/block visibility from their `hidden` flags and `required` flags.
4. Apply enabled rules in priority order, mutating visibility, required flags, and
   resolved values.
5. Emit a `ResolvedDocument` with per-section and per-block `visible`/`required` flags,
   the final `resolvedValues`, and `hasCyclicDependency`.

Only blocks and sections that are `visible` in the resolved document are rendered in the
preview and included in exports.
