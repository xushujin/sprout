// Deployment helper for the explicitly authorized WordSprout project.
// The OAuth token is captured in memory and is never logged or written here.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

const account = '59d1142ec45805e0ed0a5e04c242cd84';
const domain = 'wordsprout.hatim.eu.org';
const project = 'wordsprout';
const action = process.argv[2] ?? 'inspect';
const auth = JSON.parse(
  execFileSync('npx', ['wrangler', 'auth', 'token', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
if (!auth.token) throw new Error('请先运行 npx wrangler login。');

async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const value = await response.json();
  if (!response.ok || value.success === false || value.errors?.length)
    throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(value.errors)}`);
  return value.result ?? value.data;
}
const projectPath = `/accounts/${account}/pages/projects/${project}`;
async function zone() {
  const zones = await api('/zones?name=hatim.eu.org');
  const found = zones.find((item) => item.name === 'hatim.eu.org' && item.account.id === account);
  if (!found) throw new Error('授权账号中找不到 hatim.eu.org。');
  return found;
}

if (action === 'inspect') {
  const results = await Promise.allSettled([
    zone(),
    api(`/accounts/${account}/subscriptions`),
    api(`/accounts/${account}/workers/account-settings`),
    api(`/accounts/${account}/pages/projects`),
    api(`/accounts/${account}/workers/scripts`),
    api(`/accounts/${account}/d1/database`),
    api(`/accounts/${account}/storage/kv/namespaces`),
  ]);
  const labels = ['zone', 'subscriptions', 'workers-settings', 'pages', 'workers', 'd1', 'kv'];
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item.status === 'rejected') {
      console.log(labels[i], item.reason.message);
      continue;
    }
    let value = item.value;
    if (i === 0)
      value = {
        id: value.id,
        name: value.name,
        status: value.status,
        plan: value.plan?.name,
        account: value.account.id,
      };
    if (i === 1)
      value = value.map((sub) => ({
        id: sub.id,
        status: sub.status,
        rate_plan: sub.rate_plan?.id,
        name: sub.rate_plan?.public_name,
        price: sub.price,
      }));
    if (i === 3)
      value = value.map((p) => ({ name: p.name, subdomain: p.subdomain, domains: p.domains }));
    if (i === 4) value = value.map((p) => ({ id: p.id, usage_model: p.usage_model }));
    console.log(labels[i], JSON.stringify(value));
  }
} else if (action === 'domain-add') {
  console.log(JSON.stringify(await api(`${projectPath}/domains`, 'POST', { name: domain })));
} else if (action === 'domain-status') {
  console.log('domain', JSON.stringify(await api(`${projectPath}/domains/${domain}`)));
} else if (action === 'domain-retry') {
  console.log('domain', JSON.stringify(await api(`${projectPath}/domains/${domain}`, 'PATCH', {})));
} else if (action === 'runtime-status') {
  const current = await zone();
  const checks = [
    ['routes', `/zones/${current.id}/workers/routes`],
    ['cron', `/accounts/${account}/workers/scripts/wordsprout-api/schedules`],
    ['worker-subdomain', `/accounts/${account}/workers/scripts/wordsprout-api/subdomain`],
    ['kv-keys', `/accounts/${account}/storage/kv/namespaces/139a19c67a54451d8b93869547d0927c/keys`],
  ];
  const results = await Promise.allSettled(checks.map(([, path]) => api(path)));
  for (const [i, result] of results.entries()) {
    console.log(
      checks[i][0],
      result.status === 'fulfilled' ? JSON.stringify(result.value) : result.reason.message,
    );
  }
} else if (action === 'metrics') {
  const data = await api('/graphql', 'POST', {
    query: `query ($account: string, $start: string, $end: string) {
      viewer { accounts(filter: {accountTag: $account}) {
        workersInvocationsAdaptive(limit: 100, filter: {scriptName: "wordsprout-api", datetime_geq: $start, datetime_leq: $end}) {
          sum { requests errors subrequests }
          quantiles { cpuTimeP50 cpuTimeP99 }
          dimensions { status }
        }
      } }
    }`,
    variables: {
      account,
      start: new Date(Date.now() - 3_600_000).toISOString(),
      end: new Date().toISOString(),
    },
  });
  console.log('workers-metrics', JSON.stringify(data));
} else if (action === 'verify-data') {
  const result = await api(
    `/accounts/${account}/d1/database/4482d261-410c-44b8-b752-8be5d2c234d0/query`,
    'POST',
    {
      sql: "SELECT (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins, (SELECT COUNT(*) FROM users WHERE username LIKE 'smoke-%') AS test_accounts, (SELECT COUNT(*) FROM score_events e JOIN users u ON u.id = e.user_id WHERE u.username LIKE 'smoke-%') AS test_events",
      params: [],
    },
  );
  console.log('data-check', JSON.stringify(result[0].results));
} else if (action === 'verify-audio') {
  const { chromium } = await import('@playwright/test');
  const verifyIpv4 = process.env.WORDSPROUT_VERIFY_IPV4;
  if (verifyIpv4 && !/^\d{1,3}(\.\d{1,3}){3}$/.test(verifyIpv4))
    throw new Error('IPv4 格式不正确。');
  const browser = await chromium.launch({
    channel: 'chrome',
    args: verifyIpv4 ? [`--host-resolver-rules=MAP ${domain} ${verifyIpv4}`] : [],
  });
  const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => console.log('browser-error', error.message));
    page.on('response', (response) => {
      if (response.status() >= 400)
        console.log('http-error', new URL(response.url()).pathname, response.status());
    });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: undefined,
        configurable: true,
      });
      const nativePlay = HTMLMediaElement.prototype.play;
      window.audioPlayed = [];
      const observed = new WeakSet();
      HTMLMediaElement.prototype.play = function () {
        if (!observed.has(this)) {
          this.addEventListener('playing', () => window.audioPlayed.push(this.currentSrc));
          observed.add(this);
        }
        return nativePlay.call(this);
      };
    });
    // UI-only fixture: do not log out the real administrator's active session
    // or write any production learning data while checking public MP3 assets.
    await page.route('**/api/me', (route) =>
      route.fulfill({
        json: {
          user: {
            id: 'audio-verification',
            username: 'audio-verification',
            display_name: '发音验证',
            role: 'student',
          },
        },
      }),
    );
    const homeResponse = await page.goto(`https://${domain}/`);
    console.log('home-response', homeResponse.status(), 'title', await page.title());
    await page.getByRole('button', { name: '开始一轮学习' }).click();
    const audioResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/audio/apple.mp3',
    );
    await page.getByRole('button', { name: '听一听发音' }).click();
    const response = await audioResponse;
    if (!response.ok() || !response.headers()['content-type']?.includes('audio/mpeg'))
      throw new Error('音频 MIME 或响应不正确。');
    await page.waitForFunction(() => window.audioPlayed.length === 1);
    const ids = JSON.parse(readFileSync('public/audio/sources.json', 'utf8')).map(
      (item) => item.word,
    );
    if (ids.length !== 600) throw new Error('Only 600 audited general words may be published.');
    const hashes = Object.fromEntries(
      ids.map((id) => [
        id,
        createHash('sha256')
          .update(readFileSync(`public/audio/${id}.mp3`))
          .digest('hex'),
      ]),
    );
    const picker = page.getByRole('region', { name: '选择学习词库' });
    await page.reload();
    if ((await picker.getByRole('tab').count()) !== 3)
      throw new Error('Expected grade, difficulty and preschool tabs.');
    await picker.getByRole('button', { name: '六年级' }).click();
    await page.waitForFunction(
      () => document.querySelector('.preview-card h3')?.textContent === 'apple',
    );
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector('.preview-card h3')?.textContent === 'apple',
    );
    await page.getByRole('button', { name: '开始一轮学习' }).click();
    const generalAudio = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/audio/apple.mp3',
    );
    await page.getByRole('button', { name: '听一听发音' }).click();
    if (!(await generalAudio).ok()) throw new Error('通用词库发音未上线。');
    await page.waitForFunction(() => window.audioPlayed.length > 0);
    await page.goto(`https://${domain}/`);
    await page.getByRole('button', { name: '开始一轮学习' }).waitFor();
    await picker.getByRole('tab', { name: '按难度' }).click();
    for (const [label, count] of [
      ['入门词库', 200],
      ['基础词库', 400],
      ['进阶词库', 600],
    ]) {
      await picker.getByRole('button', { name: label }).click();
      await page.waitForFunction(
        (expected) =>
          document
            .querySelector('.book-selection-summary')
            ?.textContent?.includes(`/ ${expected} 项`),
        count,
      );
    }
    for (const [theme, word] of [
      ['英语启蒙与问候', 'hi'],
      ['数字与数量', 'one'],
    ]) {
      await page.goto(`https://${domain}/`);
      await picker.getByRole('tab', { name: '幼小衔接' }).click();
      await picker.getByRole('button', { name: new RegExp(`^${theme}`) }).click();
      await page.waitForFunction(
        (expected) => document.querySelector('.preview-card h3')?.textContent === expected,
        word,
      );
      await page.getByRole('button', { name: '开始一轮学习' }).click();
      const preschoolAudio = page.waitForResponse(
        (response) => new URL(response.url()).pathname === `/audio/${word}.mp3`,
      );
      await page.getByRole('button', { name: '听一听发音' }).click();
      const response = await preschoolAudio;
      if (!response.ok() || new URL(response.url()).searchParams.get('v') !== '3')
        throw new Error(`幼小衔接发音或缓存版本未更新：${word}`);
      await page.waitForFunction(
        (expected) => window.audioPlayed.some((url) => url.includes(`/audio/${expected}.mp3`)),
        word,
      );
    }
    const durations = await page.evaluate(
      async ({ words, hashes }) => {
        const decoder = new AudioContext();
        try {
          return await Promise.all(
            [...new Set(words)].map(async (id) => {
              const response = await fetch(`/audio/${id}.mp3?v=3`);
              if (!response.ok) throw new Error(`音频返回错误：${id}`);
              const bytes = await response.arrayBuffer();
              const digest = await crypto.subtle.digest('SHA-256', bytes);
              const hash = [...new Uint8Array(digest)]
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join('');
              if (hash !== hashes[id]) throw new Error(`线上音频与本地文件不一致：${id}`);
              const audio = await decoder.decodeAudioData(bytes);
              return audio.duration;
            }),
          );
        } finally {
          await decoder.close();
        }
      },
      { words: ids, hashes },
    );
    if (durations.length !== new Set(ids).size || durations.some((value) => value < 0.2))
      throw new Error('音频解码检查失败。');
    console.log(
      `正式域名验证通过：年级/难度/幼小衔接入口、选择持久化、禁用系统朗读后 ${durations.length}/600 个音频成功解码且 SHA-256 与本地文件一致。未写入生产学习数据。`,
    );
  } finally {
    await browser.close();
  }
} else if (action === 'verify-browser') {
  // Fresh browser profile; only the generated WordSprout credentials are used.
  const { chromium } = await import('@playwright/test');
  const { mkdirSync } = await import('node:fs');
  const credentials = JSON.parse(readFileSync('.secrets.admin.json', 'utf8'));
  const verifyIpv4 = process.env.WORDSPROUT_VERIFY_IPV4;
  if (verifyIpv4 && !/^\d{1,3}(\.\d{1,3}){3}$/.test(verifyIpv4))
    throw new Error('IPv4 格式不正确。');
  const browser = await chromium.launch({
    channel: 'chrome',
    // Optional public-DNS IPv4 workaround for a host with broken IPv6 routing.
    // Host, TLS SNI and certificate verification still use the real domain.
    args: verifyIpv4 ? [`--host-resolver-rules=MAP ${domain} ${verifyIpv4}`] : [],
  });
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => console.log('browser-error', error.message));
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/api/')) console.log('api-response', path, response.status());
  });
  const username = `smoke-${Date.now().toString(36)}`;
  const studentPassword = randomBytes(24).toString('base64url');
  let created = false;
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    const response = await page.goto(`https://${domain}/admin`);
    check(response.ok(), '正式域名未返回正常页面。');
    await page.getByLabel('用户名', { exact: true }).fill(credentials.username);
    await page.getByLabel('密码', { exact: true }).fill(credentials.password);
    await page.getByRole('button', { name: '进入我的花园' }).click();
    await page.getByRole('heading', { name: '照顾每一颗小芽' }).waitFor();
    await page.getByLabel('用户名', { exact: true }).fill(username);
    await page.getByLabel('公开昵称').fill('发布验证小芽');
    await page.getByLabel('初始密码').fill(studentPassword);
    await page.getByRole('button', { name: '创建账号' }).click();
    await page.getByText('学生账号已创建，请将初始密码交给学生。').waitFor();
    created = true;
    // The production database already holds real students, so scope every
    // control to this smoke account's own row.
    const row = page.getByRole('row').filter({ hasText: username });
    await row.getByRole('button', { name: '修改昵称' }).click();
    await row.getByLabel('为发布验证小芽设置新昵称').fill('发布验证小太阳');
    await row.getByRole('button', { name: '保存昵称' }).click();
    await page
      .getByText('昵称已更新，学生刷新页面后即可看到；排行榜将在下次自动刷新后更新。')
      .waitFor();
    await page.getByRole('button', { name: '退出登录' }).click();
    await page.getByRole('button', { name: '进入我的花园' }).waitFor();
    await page.getByLabel('用户名', { exact: true }).fill(username);
    await page.getByLabel('密码', { exact: true }).fill(studentPassword);
    await page.getByRole('button', { name: '进入我的花园' }).click();
    await page.getByRole('heading', { name: '你好，发布验证小太阳' }).waitFor();
    const session = (await context.cookies()).find((item) => item.name === '__Host-ws_session');
    check(
      session?.httpOnly && session.secure && session.sameSite === 'Strict',
      'Cookie 安全属性不正确。',
    );
    check(session.expires > Date.now() / 1000 + 29 * 86400, '长期会话未生效。');
    await page.reload();
    await page.getByRole('heading', { name: '你好，发布验证小太阳' }).waitFor();
    mkdirSync('test-results/production', { recursive: true });
    await page.screenshot({ path: 'test-results/production/garden.png', fullPage: true });
    let submissions = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/scores')) submissions++;
    });
    await page.getByRole('button', { name: '开始一轮学习' }).click();
    const scoreResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/scores',
    );
    for (const [i, word] of ['苹果', '香蕉', '橙子', '葡萄', '梨'].entries()) {
      await page.getByRole('button', { name: '记住啦，来挑战' }).click();
      await page.getByRole('button', { name: `选择${word}`, exact: true }).click();
      await page.getByRole('button', { name: i === 4 ? '收获本轮成长' : '下一个单词' }).click();
    }
    check((await scoreResponse).ok(), '学习提交请求失败。');
    await page.getByText('学习进度保存在本机，积分已同步').waitFor();
    check(submissions === 1, '每轮应只提交一次。');
    const rows = await api(
      `/accounts/${account}/d1/database/4482d261-410c-44b8-b752-8be5d2c234d0/query`,
      'POST',
      {
        sql: 'SELECT COUNT(*) AS rounds, SUM(e.points_earned) AS points FROM score_events e JOIN users u ON e.user_id = u.id WHERE u.username = ?',
        params: [username],
      },
    );
    check(
      rows[0].results[0].rounds === 1 && rows[0].results[0].points === 50,
      '线上记分未正确入库。',
    );
    await page.getByRole('button', { name: '退出登录' }).click();
    await page.getByRole('button', { name: '进入我的花园' }).waitFor();
    check(
      !(await context.cookies()).some((item) => item.name === '__Host-ws_session'),
      '退出后 Cookie 未清除。',
    );
    check(
      (await page.evaluate(() => localStorage.getItem('wordsprout:last-username'))) === null,
      '退出后用户名未清除。',
    );
    console.log(
      '线上验证通过：HTTPS、管理员建号与改昵称、30 天安全 Cookie、自动登录、整轮一次提交、D1 记分和退出清理。',
    );
  } catch (error) {
    console.log(
      'visible-message',
      await page
        .locator('.form-error, .boot-notice')
        .allTextContents()
        .catch(() => []),
    );
    console.log(
      'headings',
      await page
        .locator('h1, h2')
        .allTextContents()
        .catch(() => []),
    );
    throw error;
  } finally {
    await browser.close();
    if (created) {
      await api(
        `/accounts/${account}/d1/database/4482d261-410c-44b8-b752-8be5d2c234d0/query`,
        'POST',
        {
          sql: "DELETE FROM users WHERE username = ? AND role = 'student'",
          params: [username],
        },
      );
      console.log('已清理本次发布验证账号及关联学习记录。');
    }
  }
} else if (action === 'seed-admin') {
  const path = '.secrets.admin.json';
  const query = await api(
    `/accounts/${account}/d1/database/4482d261-410c-44b8-b752-8be5d2c234d0/query`,
    'POST',
    {
      sql: "SELECT id, username FROM users WHERE role = 'admin' LIMIT 1",
      params: [],
    },
  );
  if (query[0].results.length) {
    console.log('管理员已存在；保留原有密码。');
  } else {
    if (!existsSync(path))
      writeFileSync(
        path,
        JSON.stringify(
          {
            url: `https://${domain}/admin`,
            username: 'admin',
            password: randomBytes(24).toString('base64url'),
          },
          null,
          2,
        ) + '\n',
        { mode: 0o600 },
      );
    const credentials = JSON.parse(readFileSync(path, 'utf8'));
    execFileSync(
      process.execPath,
      ['scripts/seed.mjs', '--remote', '--pepper-file', '.secrets.production.json'],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          ADMIN_USERNAME: credentials.username,
          ADMIN_PASSWORD: credentials.password,
        },
      },
    );
    console.log(`生产管理员已初始化；登录信息在本机 ${path}（未提交到 Git）。`);
  }
} else if (action === 'dns-inspect') {
  const current = await zone();
  console.log('dns', JSON.stringify(await api(`/zones/${current.id}/dns_records?name=${domain}`)));
  console.log('routes', JSON.stringify(await api(`/zones/${current.id}/workers/routes`)));
} else if (action === 'dns-create') {
  const current = await zone();
  const records = await api(`/zones/${current.id}/dns_records?name=${domain}`);
  const pages = await api(projectPath);
  if (records.length) throw new Error('子域名已有记录，拒绝覆盖。');
  console.log(
    JSON.stringify(
      await api(`/zones/${current.id}/dns_records`, 'POST', {
        type: 'CNAME',
        name: domain,
        content: pages.subdomain,
        proxied: true,
        ttl: 1,
        comment: 'WordSprout Pages',
      }),
    ),
  );
} else {
  throw new Error(`不支持的操作：${action}`);
}
