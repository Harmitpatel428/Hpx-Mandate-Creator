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

## Run (development)

```bash
npm run dev
```

Launches the Electron app with hot-reloading renderer.

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

## Package installers

```bash
npm run build:mac     # .dmg (x64 + arm64)
npm run build:win     # .exe (NSIS installer)
npm run build:linux   # AppImage
```

Packaging is configured in [`electron-builder.yml`](./electron-builder.yml). Each target
must be built on (or cross-compiled for) its own platform; code signing is not configured
and should be added before public distribution.

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
