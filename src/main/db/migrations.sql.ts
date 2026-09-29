/**
 * Embedded SQL migrations. Kept in sync with the .sql files in
 * ./migrations/ (which remain the human-readable source of truth), but
 * inlined here so the DDL is bundled into the packaged main process.
 */

export interface Migration {
  version: number
  sql: string
}

const M001 = `
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'draft',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT,
  content     TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS project_versions (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_num INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  label       TEXT,
  UNIQUE(project_id, version_num)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_project_id ON project_versions(project_id);
`

const M002 = `
CREATE TABLE IF NOT EXISTS templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'General',
  is_sample   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  content     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clauses (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'General',
  tags        TEXT NOT NULL DEFAULT '[]',
  is_sample   INTEGER NOT NULL DEFAULT 0,
  kind        TEXT NOT NULL DEFAULT 'blocks',
  section     TEXT,
  blocks      TEXT NOT NULL DEFAULT '[]',
  variables   TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON templates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clauses_category     ON clauses(category);
CREATE INDEX IF NOT EXISTS idx_clauses_updated_at   ON clauses(updated_at DESC);
`

export const MIGRATIONS: Migration[] = [
  { version: 1, sql: M001 },
  { version: 2, sql: M002 },
]
