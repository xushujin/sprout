// One-time migration for the reward-points release (2026-11-18).
// Creates the gift log and the separate reward balance used for avatar unlocks.
//
//   npm run db:gifts              # local .wrangler database
//   npm run db:gifts -- --remote  # production D1
import { spawnSync } from 'node:child_process';

const remote = process.argv.includes('--remote');
const target = remote ? '--remote' : '--local';

function execute(sql) {
  return spawnSync('npx', ['wrangler', 'd1', 'execute', 'wordsprout', target, '--command', sql], {
    stdio: 'inherit',
  });
}

console.log(`Creating gift_events (${remote ? 'remote' : 'local'})…`);
execute(`CREATE TABLE IF NOT EXISTS gift_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
)`);
execute('CREATE INDEX IF NOT EXISTS gift_events_user ON gift_events(user_id, created_at)');

console.log('Adding users.gift_points…');
// Re-running fails with "duplicate column name"; that is the expected no-op.
const alter = execute('ALTER TABLE users ADD COLUMN gift_points INTEGER NOT NULL DEFAULT 0');
if (alter.status !== 0)
  console.log('gift_points already present (or ALTER failed) — see wrangler output.');
process.exitCode = 0;
