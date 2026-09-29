# Export

The app exports the **resolved** document (visible blocks only, placeholders replaced
with formatted values) to DOCX and PDF. Both exporters run in the main process and both
re-validate the persisted document server-side before generating anything (see
[VALIDATION.md](./VALIDATION.md)).

## Shared rendering

`shared/document-model/render-utils.ts` provides the conversions used by the preview and
the DOCX exporter:

- `tiptapToParagraphs` — Tiptap JSON → structured paragraphs with per-run marks
  (bold/italic/underline/strike) and list/heading info.
- `resolvePlaceholders` — replace `{{key}}` with the resolved, type-formatted value
  (currency in ₹ with Indian digit grouping, dates, booleans as Yes/No, lists joined).
- `sectionLabel` — section numbering in decimal, alpha, or roman style.

## Preview

Route `#/preview/:projectId` renders a chrome-free, print-optimized sheet. It loads the
document over IPC, runs `resolveDocument`, and renders visible sections/blocks. Page size
and margins come from the document and are injected as an `@page` rule; `print.css` adds
`break-inside: avoid` and a DRAFT watermark for non-final documents.

When the query flag `?export=1` is present the preview strips screen chrome. Once content
has painted it sets `document.title = 'EXPORT_READY'` — the signal the PDF pipeline waits
for.

## DOCX (`export-docx.service.ts`)

Runs in the main process using the [`docx`](https://www.npmjs.com/package/docx) library.
It maps the resolved document to Word elements:

- headings → styled heading paragraphs
- rich-text paragraphs → `Paragraph`/`TextRun` with marks, bullet and numbered lists
- tables → bordered `Table`s with a shaded header row
- notes → shaded paragraphs (internal notes excluded unless enabled in export settings)
- signatures → signature lines with optional date/place lines
- page breaks → `pageBreakBefore`

Page size (A4/Letter/Legal), orientation, and margins are applied from the document's
page settings. The result is a `Buffer` written to the chosen path.

## PDF (`export-pdf.service.ts`)

Uses **Electron's built-in Chromium** — no external PDF engine, no Playwright.

1. A hidden `BrowserWindow` (with the same preload) loads `#/preview/:id?export=1`.
2. The service waits for the `EXPORT_READY` title signal (with a timeout so a broken
   render can't hang export).
3. `webContents.printToPDF({ preferCSSPageSize: true, printBackground: true })` renders
   the PDF, honoring the preview's `@page` size/margins.
4. The window is destroyed and the `Buffer` is written to the chosen path.

## Export flow (UI)

The Export modal:

1. Runs client-side validation and disables export while errors exist.
2. Lets the user choose format (DOCX/PDF), page size, and filename.
3. Persists the current in-memory document so the server exports exactly what the user
   sees.
4. Shows a native save dialog and calls the export IPC.
5. Surfaces success (with the file path) or the server's validation issues on failure.
