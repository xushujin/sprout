import { expect, test, type Page } from '@playwright/test';
import { derivePasswordProof } from '../../shared/password';
import { answerCorrectly, answerWrong } from './quiz-helper';

const password = 'E2e-only-password-123';
async function signIn(page: Page, username: string, remember = true) {
  await page.getByRole('button', { name: '进入我的花园' }).waitFor();
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByRole('checkbox').setChecked(remember);
  await page.getByRole('button', { name: '进入我的花园' }).click();
}

test('teacher → student → auto login → offline round → retry → snapshot → logout', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const proofs: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/')) {
      const payload = request.postDataJSON();
      expect(payload).not.toHaveProperty('password');
      if (payload?.password_proof) proofs.push(payload.password_proof);
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/admin');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.locator('[name="username"]')).toHaveAttribute('autocomplete', 'username');
  await expect(page.locator('[name="password"]')).toHaveAttribute(
    'autocomplete',
    'current-password',
  );
  await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
  await signIn(page, 'e2e-admin');
  await expect(page.getByRole('heading', { name: '照顾每一颗小芽' })).toBeVisible();
  const adminCookie = (await context.cookies()).find(
    (cookie) => cookie.name === '__Host-ws_session',
  )!;
  expect(adminCookie.httpOnly).toBe(true);
  expect(adminCookie.secure).toBe(true);
  expect(adminCookie.sameSite).toBe('Strict');
  expect(adminCookie.expires - Date.now() / 1000).toBeLessThanOrEqual(7200);
  await page.getByLabel('用户名', { exact: true }).fill('e2e-student');
  await page.getByLabel('公开昵称').fill('小橘子');
  await page.getByLabel('初始密码').fill(password);
  await page.getByRole('button', { name: '创建账号' }).click();
  await expect(page.getByText('学生账号已创建，请将初始密码交给学生。')).toBeVisible();
  await expect(page.getByRole('cell', { name: '小橘子 e2e-student' })).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '退出登录' }).click();
  await signIn(page, 'e2e-student');
  await expect(page.getByRole('heading', { name: '你好，小橘子' })).toBeVisible();
  const cookie = (await context.cookies()).find((item) => item.name === '__Host-ws_session')!;
  expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 86400);
  expect(await page.evaluate(() => document.cookie)).not.toContain('__Host-ws_session');
  await page.reload();
  await expect(page.getByRole('heading', { name: '你好，小橘子' })).toBeVisible();
  await page.screenshot({ path: 'test-results/garden-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/garden-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 393, height: 851 });

  let scoreRequests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/scores')) scoreRequests++;
  });
  await context.setOffline(true);
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  const words = [
    ['apple', '苹果'],
    ['banana', '香蕉'],
    ['orange', '橙子'],
    ['grape', '葡萄'],
    ['pear', '梨'],
  ] as const;
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '记住啦，来挑战' }).click();
    if (i === 0) await answerWrong(page, ...words[i]);
    else await answerCorrectly(page, ...words[i]);
    if (i === 1) await page.screenshot({ path: 'test-results/quiz-mobile.png', fullPage: true });
    await page.getByRole('button', { name: i === 4 ? '收获本轮成长' : '下一个单词' }).click();
  }
  await expect(page.getByText('已在本机保存 1 轮，稍后同步')).toBeVisible();
  expect(scoreRequests).toBe(0);
  await page.screenshot({ path: 'test-results/result-mobile.png', fullPage: true });
  const local = await page.evaluate(() => Object.entries(localStorage));
  expect(JSON.stringify(local)).not.toContain(password);
  expect(JSON.stringify(local)).not.toContain(cookie.value);
  for (const proof of proofs) expect(JSON.stringify(local)).not.toContain(proof);
  const saved = JSON.parse(local.find(([key]) => key.startsWith('wordsprout:progress:'))![1]);
  expect(saved.pending).toHaveLength(1);
  expect(saved.words.apple.needsReview).toBe(true);
  expect(saved.points).toBe(40);
  await context.setOffline(false);
  await expect(page.getByText('学习进度保存在本机，积分已同步')).toBeVisible();
  expect(scoreRequests).toBe(1);
  await page.getByRole('button', { name: '再种 5 个词' }).click();
  await expect(page.getByRole('heading', { name: 'apple', exact: true })).toBeVisible();
  await expect(page.getByText('补错小任务', { exact: false })).toBeVisible();
  // A reload can discard an unfinished round but retains completed local records.
  await page.reload();
  await expect(page.getByRole('heading', { name: '你好，小橘子' })).toBeVisible();
  await page.request.get('http://localhost:8787/__scheduled?cron=*/30+*+*+*+*');
  await page.getByRole('button', { name: '成长星榜' }).click();
  await expect(page.locator('.ranking-list')).toContainText('小橘子');
  await expect(page.locator('.rank-points')).toContainText('40');
  await page.screenshot({ path: 'test-results/leaderboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page.getByRole('button', { name: '进入我的花园' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('wordsprout:last-username'))).toBeNull();
  expect((await context.cookies()).some((item) => item.name === '__Host-ws_session')).toBe(false);
  await signIn(page, 'e2e-student', false);
  await expect(page.getByRole('heading', { name: '你好，小橘子' })).toBeVisible();
  expect((await context.cookies()).find((item) => item.name === '__Host-ws_session')!.expires).toBe(
    -1,
  );
  await page.getByRole('button', { name: '退出登录' }).click();
  await signIn(page, 'e2e-admin');
  await page.getByRole('button', { name: '修改昵称' }).click();
  await page.getByLabel('为小橘子设置新昵称').fill('小太阳');
  await page.getByRole('button', { name: '保存昵称' }).click();
  await expect(
    page.getByText('昵称已更新，学生刷新页面后即可看到；排行榜将在下次自动刷新后更新。'),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: '小太阳 e2e-student' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('cell', { name: '小太阳 e2e-student' })).toBeVisible();
  await page.getByRole('button', { name: '重置密码' }).click();
  await page.getByLabel('为小太阳设置新密码').fill('Changed-student-password-123');
  await page.getByRole('button', { name: '确认重置' }).click();
  await expect(page.getByText('密码已重置，学生需要重新登录。')).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: '进入我的花园' }).waitFor();
  await page.getByLabel('用户名', { exact: true }).fill('E2E-STUDENT');
  await page.getByLabel('密码', { exact: true }).fill('Changed-student-password-123');
  await page.getByRole('button', { name: '进入我的花园' }).click();
  await expect(page.getByRole('heading', { name: '你好，小太阳' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('quota errors and 200 HTML keep the queue; reload retries the identical round', async ({
  page,
}) => {
  const origin = 'http://localhost:5173';
  const admin = await page.request.post('/api/login', {
    headers: { Origin: origin },
    data: {
      username: 'e2e-admin',
      password_proof: await derivePasswordProof('e2e-admin', password),
    },
  });
  expect(admin.status()).toBe(200);
  const created = await page.request.post('/api/admin/students', {
    headers: { Origin: origin },
    data: {
      username: 'quota-student',
      display_name: '小葡萄',
      password_proof: await derivePasswordProof('quota-student', password),
    },
  });
  expect(created.status()).toBe(201);
  await page.request.post('/api/logout', { headers: { Origin: origin }, data: {} });
  await page.goto('/');
  await signIn(page, 'quota-student');
  await expect(page.getByRole('heading', { name: '你好，小葡萄' })).toBeVisible();
  const ids: string[] = [];
  let mode = 'quota';
  await page.route('**/api/scores', async (route) => {
    ids.push(route.request().postDataJSON().id);
    await route.fulfill(
      mode === 'quota'
        ? { status: 503, contentType: 'application/json', body: '{"error":"额度不足"}' }
        : { status: 200, contentType: 'text/html', body: '<html>Pages fallback</html>' },
    );
  });
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  for (const [i, pair] of (
    [
      ['apple', '苹果'],
      ['banana', '香蕉'],
      ['orange', '橙子'],
      ['grape', '葡萄'],
      ['pear', '梨'],
    ] as const
  ).entries()) {
    await page.getByRole('button', { name: '记住啦，来挑战' }).click();
    await answerCorrectly(page, ...pair);
    await page.getByRole('button', { name: i === 4 ? '收获本轮成长' : '下一个单词' }).click();
  }
  await expect(page.getByText('已在本机保存 1 轮，稍后同步')).toBeVisible();
  await page.getByRole('button', { name: '重试同步' }).click();
  expect(ids).toHaveLength(1); // backoff prevents a manual retry storm
  mode = 'html';
  await page.reload();
  await expect(page.getByText('已在本机保存 1 轮，稍后同步')).toBeVisible();
  expect(ids).toEqual([ids[0], ids[0]]);
  await page.unroute('**/api/scores');
  const retry = page.waitForRequest('**/api/scores');
  await page.reload();
  expect((await retry).postDataJSON().id).toBe(ids[0]);
  await expect(page.getByText('学习进度保存在本机，积分已同步')).toBeVisible();
});
