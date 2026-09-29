# Validation

The validation engine (`shared/validation-engine`) checks a document for problems that
would make it incorrect or un-exportable. It runs against the **resolved** document (see
[LOGIC_ENGINE.md](./LOGIC_ENGINE.md)), so it only flags content that is actually visible
after rules are applied — a hidden required block is not reported.

## API

```ts
validateDocument(doc: MandateDocument): ValidationResult[]
hasErrors(results: ValidationResult[]): boolean
```

Each `ValidationResult` has:

```ts
{
  id, severity: 'error' | 'warning',
  code, message,
  targetId, targetType: 'block' | 'section' | 'variable' | 'document'
}
```

`targetId` / `targetType` let the UI focus the offending element on click.

## Checks

| Code | Severity | What it catches |
|---|---|---|
| `duplicate_variable_key` | error | Two variables share the same `{{key}}`. |
| `circular_dependency` | error | Calculated variables reference each other in a cycle. |
| `invalid_formula` | error | A calculated variable's formula fails to parse. |
| `missing_required` | error | A visible, required section/block has no content. |
| `unresolved_placeholder` | warning | A `{{placeholder}}` has no matching variable. |

## Where it runs

- **Editor** — the Validation panel runs `validateDocument` on demand and lists results
  grouped by severity, with click-to-focus navigation.
- **Export gate (client)** — the Export modal runs it before showing options and blocks
  export while any `error` exists (warnings are allowed).
- **Export gate (server)** — the main process **re-validates** the persisted document
  before generating a DOCX or PDF. If blocking errors exist it refuses and returns the
  issues, so export can never bypass validation even if the client is out of sync. This
  is the authoritative gate; the client check is for UX.
