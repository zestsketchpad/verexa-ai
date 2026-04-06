PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profile_facts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  confidence INTEGER,
  source TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_profile_facts_session
  ON profile_facts(session_id, updated_at DESC);
