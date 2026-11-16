PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 20),
  role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
  created_at INTEGER NOT NULL,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  owned_items TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS users_role_id ON users(role, id);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS score_events (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  words_learned INTEGER NOT NULL CHECK(words_learned BETWEEN 0 AND 5),
  words_reviewed INTEGER NOT NULL CHECK(words_reviewed BETWEEN 0 AND 5),
  correct_count INTEGER NOT NULL CHECK(correct_count BETWEEN 0 AND 5),
  total_count INTEGER NOT NULL CHECK(total_count = 5),
  mistakes_corrected INTEGER NOT NULL DEFAULT 0 CHECK(mistakes_corrected BETWEEN 0 AND correct_count),
  points_earned INTEGER NOT NULL CHECK(points_earned = correct_count * 10 + mistakes_corrected * 5),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, id),
  CHECK(words_learned + words_reviewed = total_count),
  CHECK(mistakes_corrected <= words_reviewed)
);
CREATE INDEX IF NOT EXISTS score_events_week ON score_events(created_at, user_id);
CREATE INDEX IF NOT EXISTS score_events_user_week ON score_events(user_id, created_at);

CREATE TABLE IF NOT EXISTS spend_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS spend_events_week ON spend_events(created_at, user_id);
CREATE INDEX IF NOT EXISTS spend_events_user_week ON spend_events(user_id, created_at);
