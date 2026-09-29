# Master Mandate Creator

An offline-first desktop application for authoring mandates, engagement letters, and
other structured legal/business documents. Built with Electron, React, and TypeScript,
it runs entirely locally with zero external network dependency.

Features:

- **Structured editor** — sections and typed blocks (headings, rich-text paragraphs,
  tables, notes, signatures, page breaks) with drag-and-drop reordering.
- **Variables** — typed, reusable values (text, number, currency ₹, date, boolean,
  select, list, and calculated formulas) referenced in content via `{{placeholders}}`.
- **Logic engine** — visual IF/THEN rules that show/hide content, set values, and mark
  fields required based on variable conditions.
- **Validation engine** — checks the resolved document for missing required content,
  unresolved placeholders, circular dependencies, invalid formulas, and duplicate keys.
- **Preview & export** — print-optimized preview, DOCX export (via the `docx` library),
  and PDF export via Electron's built-in Chromium (`printToPDF`).
- **Template & clause libraries** — save whole documents as templates and sections/blocks
  as reusable clauses; insert clauses with variable remapping.
- **Version history & backups** — automatic version snapshots, manual snapshots, restore,
  and safety backups before destructive actions.

## Requirements

- Node.js 20+
- npm 9+

## Setup

```bash
npm install
```

`postinstall` rebuilds the `better-sqlite3` native module against Electron's ABI. If
the native module is unavailable on a given platform, the app automatically falls back
to a JSON file store, so it still runs.

## Development loop

The fastest way to iterate is the **web dev build** — it runs the full renderer
in a normal browser with hot reload, backed by a `localStorage` shim that
implements the same API the Electron preload exposes. No Electron, no native
modules, no packaging needed for day-to-day work.

```bash
npm run dev:web      # Vite dev server at http://localhost:5174 (opens your browser)
```

Everything works in the browser: dashboard/CRUD, block editing, variables and
`{{placeholders}}`, the logic builder, validation, preview, and **DOCX export**
(downloaded via the browser). Data persists in `localStorage` across reloads.
The one difference from desktop: **PDF export** opens the browser's print dialog
(choose "Save as PDF") — one-click native PDF (Electron `printToPDF`) ships only
in the packaged desktop app.

Edit in your editor → the browser hot-reloads → verify → push.

### Full Electron dev (optional)

```bash
npm run dev
```

Launches the actual Electron app with a hot-reloading renderer. Use this when you
need to exercise desktop-only behavior (native PDF export, SQLite storage).

## Test

```bash
npm test          # run the vitest suite once
npm run test:watch
```

## Type-check & lint

```bash
npm run typecheck:node   # main + preload + shared
npm run typecheck:web    # renderer
npm run lint
```

## Build

```bash
npm run build     # compile main, preload, and renderer into out/
```

## Getting an installer (via GitHub Actions — no local machine needed)

Every push builds installers for all three platforms in CI. This is the
recommended way to get a Windows `.exe` (or macOS `.dmg`) without owning that OS.

1. `git push` your branch.
2. Open the repo on GitHub → **Actions** → the latest **Build** run.
3. Download the artifact from the **Artifacts** section:
   - `installer-windows-exe` → the NSIS `.exe`
   - `installer-macos-dmg` → the `.dmg`
   - `installer-linux-appimage` → the `.AppImage`

The workflow ([`.github/workflows/build.yml`](./.github/workflows/build.yml)) first
runs typecheck/lint/tests/build, then packages each platform on its native runner
(where `better-sqlite3` is rebuilt for the Electron ABI, enabling SQLite storage).

### Building installers locally

```bash
npm run build:mac     # .dmg (x64 + arm64)  — requires macOS
npm run build:win     # .exe (NSIS)         — requires Windows
npm run build:linux   # AppImage            — requires Linux
```

Packaging is configured in [`electron-builder.yml`](./electron-builder.yml). Each
target must be built on its own platform. Code signing is not configured and should
be added before public distribution.

## Data & storage

All data is stored locally under Electron's `userData` directory:

- `master-mandate.db` — SQLite database (primary), or
- `storage/` — JSON files (fallback when SQLite is unavailable)
- `backups/` — safety snapshots written before restore/delete (last 20 retained)

On first launch the app seeds one sample mandate, one sample template, and several sample
clauses, all clearly marked **Sample**.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Logic engine](./docs/LOGIC_ENGINE.md)
- [Validation](./docs/VALIDATION.md)
- [Export](./docs/EXPORT.md)
- [Roadmap](./ROADMAP.md)

## License

UNLICENSED — private project.
