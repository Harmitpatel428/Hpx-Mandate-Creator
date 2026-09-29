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

INSERT OR IGNORE INTO schema_migrations(version) VALUES (2);
