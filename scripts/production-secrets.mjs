import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const path = '.secrets.production.json';
if (existsSync(path))
  throw new Error(`${path} 已存在。不要覆盖：更换 pepper 会让所有已有密码失效。`);
writeFileSync(path, JSON.stringify({ PASSWORD_PEPPER: randomBytes(32).toString('hex') }), {
  mode: 0o600,
});
console.log(`已生成 ${path}。请加密备份，远端 seed 使用同一文件。`);
const result = spawnSync('npx', ['wrangler', 'secret', 'bulk', path], { stdio: 'inherit' });
if (result.status !== 0) console.error(`上传未完成。重试：npx wrangler secret bulk ${path}`);
process.exitCode = result.status ?? 1;
