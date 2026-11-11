import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (!existsSync('.dev.vars')) {
  writeFileSync(
    '.dev.vars',
    `PASSWORD_PEPPER=${randomBytes(32).toString('hex')}\nAPP_ORIGIN=http://localhost:5173\n`,
    { mode: 0o600 },
  );
  console.log('已生成本地 .dev.vars（仅供本机，不要提交）。');
} else {
  console.log('.dev.vars 已存在，保留原密钥。');
}
console.log('下一步：npm run db:local，然后 npm run seed。');
