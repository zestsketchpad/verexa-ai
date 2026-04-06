PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_input TEXT NOT NULL,
  normalized_input TEXT,
  verified_response TEXT NOT NULL,
  mode TEXT,
  score INTEGER,
  confidence INTEGER,
  tone TEXT,
  reasoning TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memory_items_session_created
  ON memory_items(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_updated_at
  ON sessions(updated_at DESC);
