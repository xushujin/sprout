// One-time migration for the paid-cosmetics release (2026-11-18).
// Adds users.owned_styles and grants every paid option a student is already
// wearing, so nobody has to buy their current look again.
//
//   npm run db:styles              # local .wrangler database
//   npm run db:styles -- --remote  # production D1
import { spawnSync } from 'node:child_process';

const remote = process.argv.includes('--remote');
const target = remote ? '--remote' : '--local';

function execute(sql) {
  return spawnSync('npx', ['wrangler', 'd1', 'execute', 'wordsprout', target, '--command', sql], {
    stdio: 'inherit',
  });
}

console.log(`Adding users.owned_styles (${remote ? 'remote' : 'local'})…`);
// Re-running fails with "duplicate column name"; that is the expected no-op.
execute("ALTER TABLE users ADD COLUMN owned_styles TEXT NOT NULL DEFAULT '[]'");

// Only fill untouched rows, so re-running can never erase later unlocks.
const backfill = `
UPDATE users
SET owned_styles = (
  SELECT COALESCE(json_group_array(style), '[]')
  FROM (
    SELECT 'hair:' || json_extract(avatar, '$.hair') AS style
    WHERE json_extract(avatar, '$.hair') IN ('short', 'curly', 'ponytail', 'buns')
    UNION
    SELECT 'skin:' || json_extract(avatar, '$.skin')
    WHERE json_extract(avatar, '$.skin') IN ('tan', 'deep')
    UNION
    SELECT 'outfit:' || json_extract(avatar, '$.outfit')
    WHERE json_extract(avatar, '$.outfit') IN ('hoodie', 'overalls', 'dress', 'pinafore')
  )
)
WHERE avatar IS NOT NULL AND owned_styles = '[]'`;

console.log('Granting currently worn paid options…');
const result = execute(backfill);
process.exitCode = result.status ?? 1;
