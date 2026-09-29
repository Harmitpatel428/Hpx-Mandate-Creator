# Roadmap

The current application is a complete, offline-first single-user document authoring tool.
The items below are potential future directions, roughly in order of likely value. None
are implemented yet.

## Authentication & multi-user
- Local user accounts and per-user document ownership.
- Role-based permissions (author, reviewer, viewer).

## Collaboration
- Real-time or asynchronous co-editing with presence and comments.
- Change tracking and review/approval workflows.
- A shared server component (see PostgreSQL migration below) to back collaboration.

## E-signature
- Integrate an e-signature provider (or a self-hosted flow) for signature blocks.
- Signed-document audit trail and tamper-evident sealing.

## PostgreSQL migration
- Introduce an optional server-backed store alongside the local SQLite/JSON engine.
- Keep the existing `IProjectRepository` interface; add a `PostgresRepository`
  implementation and a sync layer so the app stays offline-capable.
- Schema migration tooling to move local data to the server.

## DOCX import
- Parse `.docx` files into the document model (sections, headings, paragraphs, tables).
- Map recognized `{{placeholder}}` patterns to variables on import.
- Round-trip fidelity testing against the existing DOCX exporter.

## Other candidates
- Clause versioning and an organization-wide shared clause/template library.
- Richer table editing (merged cells, column widths, per-cell formatting).
- Conditional numbering and cross-references between sections.
- Localization / multi-language documents.
- Automated backups to a user-chosen cloud folder.
