// Isolated, local-only database and throwaway credentials for browser tests.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const pepper = readFileSync('.dev.vars', 'utf8')
  .match(/^PASSWORD_PEPPER=(.+)$/m)?.[1]
  .trim();
if (!pepper) throw new Error('先运行 npm run setup。');
mkdirSync('.wrangler/e2e', { recursive: true });
const sql = `${readFileSync('schema.sql', 'utf8')}\nDELETE FROM score_events;\nDELETE FROM sessions;\nDELETE FROM users;`;
const file = '.wrangler/e2e/seed.sql';
writeFileSync(file, sql, { mode: 0o600 });
const result = spawnSync(
  'npx',
  [
    'wrangler',
    'd1',
    'execute',
    'wordsprout',
    '--local',
    '--persist-to',
    '.wrangler/e2e/state',
    '--file',
    file,
  ],
  { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
if (result.status === 0) {
  // Exercise the delivered seed script, against the isolated local database.
  const seeded = spawnSync(
    process.execPath,
    ['scripts/seed.mjs', '--persist-to', '.wrangler/e2e/state'],
    {
      stdio: 'inherit',
      env: { ...process.env, ADMIN_USERNAME: 'e2e-admin', ADMIN_PASSWORD: 'E2e-only-password-123' },
    },
  );
  process.exitCode = seeded.status ?? 1;
}
