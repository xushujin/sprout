import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { hashPassword } from '../shared/crypto.ts';
import { derivePasswordProof } from '../shared/password.ts';

const { values } = parseArgs({
  options: {
    remote: { type: 'boolean', default: false },
    'pepper-file': { type: 'string' },
    'persist-to': { type: 'string' },
  },
});
const remote = values.remote;
const pepperFile = values['pepper-file'];
if (remote && values['persist-to']) throw new Error('--persist-to 仅适用于本地数据库。');
let pepper = process.env.PASSWORD_PEPPER;
if (!pepper && pepperFile) pepper = JSON.parse(readFileSync(pepperFile, 'utf8')).PASSWORD_PEPPER;
if (!pepper && !remote)
  pepper = readFileSync('.dev.vars', 'utf8')
    .match(/^PASSWORD_PEPPER=(.+)$/m)?.[1]
    .trim();
if (!pepper || pepper.length < 32)
  throw new Error('缺少 PASSWORD_PEPPER；远端请传 --pepper-file .secrets.production.json。');

let username = process.env.ADMIN_USERNAME;
let password = process.env.ADMIN_PASSWORD;
if ((!username || !password) && !process.stdin.isTTY)
  throw new Error('非交互执行需设置 ADMIN_USERNAME 和 ADMIN_PASSWORD。');
if (!username) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  username = (await rl.question('管理员用户名（默认 admin）：')).trim() || 'admin';
  rl.close();
}
async function hiddenPassword() {
  process.stdout.write('管理员密码（至少 12 位，输入不回显）：');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  return await new Promise((resolve, reject) => {
    let value = '';
    function done() {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    }
    function onData(chunk) {
      for (const char of chunk) {
        if (char === '\u0003') {
          done();
          reject(new Error('已取消'));
          return;
        }
        if (char === '\r' || char === '\n') {
          done();
          resolve(value);
          return;
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    }
    process.stdin.on('data', onData);
  });
}
password ||= await hiddenPassword();
if (
  !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$/.test(username) ||
  password.length < 12 ||
  password.length > 128
)
  throw new Error('用户名需为 3–32 位字母/数字/._-，管理员密码需为 12–128 位。');
const passwordHash = await hashPassword(await derivePasswordProof(username, password), pepper);
password = undefined;
delete process.env.ADMIN_PASSWORD;
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
// Insert only. Re-running seed never changes an existing password or role.
const sql = `INSERT INTO users(id, username, password_hash, display_name, role, created_at) VALUES (${quote(crypto.randomUUID())}, ${quote(username)}, ${quote(passwordHash)}, '小芽管理员', 'admin', ${Math.floor(Date.now() / 1000)});`;
const directory = mkdtempSync(join(tmpdir(), 'wordsprout-seed-'));
try {
  const file = join(directory, 'seed.sql');
  writeFileSync(file, sql, { mode: 0o600 });
  const result = spawnSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'wordsprout',
      remote ? '--remote' : '--local',
      '--file',
      file,
      ...(values['persist-to'] ? ['--persist-to', values['persist-to']] : []),
    ],
    { stdio: 'inherit' },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
