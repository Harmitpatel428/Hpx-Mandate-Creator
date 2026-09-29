# Architecture

Master Mandate Creator is an Electron application split into three processes, with a
shared, framework-agnostic domain layer.

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer (React + Zustand)                                    │
│  routes → features (dashboard, editor, preview, library)      │
│  stores: projectStore, uiStore                                │
│                    │  window.electronAPI (typed)              │
├────────────────────┼──────────────────────────────────────────┤
│ Preload (contextBridge)  — exposes a typed, minimal IPC surface│
├────────────────────┼──────────────────────────────────────────┤
│ Main (Node)         ▼                                          │
│  ipc handlers → services → repository → SQLite / JSON store    │
│  export services (DOCX in-process, PDF via printToPDF)         │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ imports
┌────────────────────────┴──────────────────────────────────────┐
│ shared/  (used by every process)                               │
│  document-model (Zod schema, types, defaults, clone, render)   │
│  logic-engine   (calculator, evaluator, cycle-detector, resolver)│
│  validation-engine                                             │
│  ipc (channel constants + request/response types)              │
└────────────────────────────────────────────────────────────────┘
```

## Processes

### Main (`src/main`)
Owns all privileged work: window creation, native menus, the security policy (CSP,
blocked navigation, `contextIsolation`), persistence, and document generation.

- **`services/`** — `ProjectService`, `LibraryService`, `SettingsService`,
  `BackupService`, `seed.service`, `export-docx.service`, `export-pdf.service`.
- **`db/`** — an `IProjectRepository` interface with two implementations:
  `SqliteRepository` (better-sqlite3) and `JsonRepository` (atomic JSON files). The
  active one is chosen at startup by `database.service`, which tries SQLite and falls
  back to JSON. Migrations are embedded as SQL strings (`db/migrations.sql.ts`) so they
  apply reliably in the packaged app.
- **`ipc/`** — thin handlers that validate input with Zod and delegate to services.
  Every handler returns `IpcResponse<T>` (`{ success: true, data } | { success: false, error }`).

### Preload (`src/preload`)
Exposes a single `window.electronAPI` object via `contextBridge`. It is the only bridge
between renderer and main; `nodeIntegration` is off and `contextIsolation` is on. The
`ElectronAPI` type is inferred from this file and re-declared globally for the renderer.

### Renderer (`src/renderer`)
A React 18 SPA using `HashRouter` (required for the `file://` protocol in production).

- **State**: Zustand with Immer. `projectStore` holds the active document and all
  section/block/variable/rule mutations plus undo/redo support; `uiStore` holds panel
  and selection state.
- **Features**: `dashboard`, `editor` (canvas, sidebars, panels, blocks), `preview`,
  and `library` (templates + clauses).

## Shared domain layer (`shared/`)

Pure TypeScript with no Electron or React imports, so it is consumed identically by the
main process (export, validation), the renderer (live editing), and the tests.

- **`document-model`** — the Zod `DocumentSchema` and inferred types are the single
  source of truth for a document's shape. `clone.ts` regenerates ids for
  templates/clauses; `render-utils.ts` converts Tiptap JSON to text, resolves and
  rewrites placeholders, and formats values; `clause-insert.ts` inserts clauses with
  remapping.
- **`logic-engine`** — see [LOGIC_ENGINE.md](./LOGIC_ENGINE.md).
- **`validation-engine`** — see [VALIDATION.md](./VALIDATION.md).

## Data flow: an edit

1. A renderer component calls a `projectStore` action (e.g. `updateBlock`).
2. Immer produces a new `document`; `saveState` becomes `unsaved`.
3. `useAutosave` debounces (1.5s) and calls `projects.saveVersion` over IPC.
4. The main `ProjectService` writes a version row and updates the project's content.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (preload needs
  Node for IPC only).
- A strict CSP is injected for all responses; external navigation and new windows are
  blocked.
- Formula evaluation never uses `eval` — it uses `expr-eval` with a fixed function set.
