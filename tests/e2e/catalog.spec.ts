import { expect, test, type Page } from '@playwright/test';

async function student(page: Page, id = 'catalog-test') {
  await page.route('**/api/me', (route) =>
    route.fulfill({
      json: { user: { id, username: id, display_name: '词库小芽', role: 'student' } },
    }),
  );
}

test('only offers independently assembled grades/levels, persists choices and never fetches retired data', async ({
  page,
}) => {
  await student(page);
  const writes: string[] = [],
    removedRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') writes.push(request.url());
    if (request.url().includes('/vocabulary/fltrp/')) removedRequests.push(request.url());
  });
  await page.goto('/');
  const picker = page.getByRole('region', { name: '选择学习词库' });
  await expect(picker.getByRole('tab')).toHaveCount(2);
  await expect(picker.getByRole('tab', { name: '外研版', exact: true })).toHaveCount(0);
  const labels = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const firstWords = ['apple', 'apple', 'apple', 'apple', 'apple', 'apple'];
  const gradeCounts = [100, 200, 300, 400, 500, 600];
  for (let i = 0; i < labels.length; i++) {
    await picker.getByRole('button', { name: labels[i] }).click();
    await expect(page.locator('.preview-card h3').first()).toHaveText(firstWords[i]);
    await expect(picker.locator('.book-selection-summary')).toContainText(`/ ${gradeCounts[i]} 项`);
  }
  await page.reload();
  await expect(picker.getByRole('button', { name: '六年级' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await picker.getByRole('tab', { name: '按难度' }).click();
  for (const [label, count] of [
    ['入门词库', 200],
    ['基础词库', 400],
    ['进阶词库', 600],
  ] as const) {
    await picker.getByRole('button', { name: label }).click();
    await expect(page.locator('.preview-card h3').first()).toHaveText('apple');
    await expect(picker.locator('.book-selection-summary')).toContainText(`/ ${count} 项`);
  }
  await page.reload();
  await expect(picker.getByRole('button', { name: '进阶词库' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(writes).toEqual([]);
  expect(removedRequests).toEqual([]);
});

test('migrates retired selection without deleting old progress or unsent rounds', async ({
  page,
}) => {
  await student(page, 'migration-test');
  await page.addInitScript(() => {
    const key = 'wordsprout:progress:v1:migration-test';
    if (!localStorage.getItem(key))
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          bookId: 'fltrp-6-2',
          words: { cashier: { seen: 2, correct: 1, needsReview: true, lastSeen: 1 } },
          pending: [
            {
              id: 'previous-round-123',
              words_learned: 5,
              words_reviewed: 0,
              correct_count: 4,
              total_count: 5,
              mistakes_corrected: 0,
              points_earned: 40,
            },
          ],
          rounds: 2,
          points: 70,
          correct: 7,
          answered: 10,
          recentRoundIds: ['previous-round-123'],
        }),
      );
  });
  await page.route('**/api/scores', (route) =>
    route.fulfill({ status: 503, json: { error: '稍后同步' } }),
  );
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: '选择学习词库' }).getByRole('button', { name: '六年级' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.preview-card h3').first()).toHaveText('apple');
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('wordsprout:progress:v1:migration-test')!).bookId,
      ),
    )
    .toBe('grade-6');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordsprout:progress:v1:migration-test')!),
  );
  expect(saved.words.cashier.needsReview).toBe(true);
  expect(saved.pending).toHaveLength(1);
  expect(saved.points).toBe(70);
  expect(saved.rounds).toBe(2);
  await page.reload();
  await expect(page.locator('.preview-card h3').first()).toHaveText('apple');
});

test('limits mistakes and distractors to the chosen general collection and awards review bonus', async ({
  page,
}) => {
  await student(page, 'scope-test');
  await page.addInitScript(() => {
    localStorage.setItem(
      'wordsprout:progress:v1:scope-test',
      JSON.stringify({
        version: 1,
        words: {
          apple: { seen: 1, correct: 0, needsReview: true, lastSeen: 1 },
          English: { seen: 1, correct: 0, needsReview: true, lastSeen: 2 },
        },
        pending: [],
        rounds: 2,
        points: 30,
        correct: 3,
        answered: 10,
        recentRoundIds: [],
      }),
    );
  });
  const submissions: Record<string, number>[] = [];
  await page.route('**/api/scores', (route) => {
    submissions.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, accepted: true } });
  });
  await page.goto('/');
  await page
    .getByRole('region', { name: '选择学习词库' })
    .getByRole('button', { name: '一年级' })
    .click();
  await expect(page.locator('.preview-card h3').first()).toHaveText('apple');
  await expect(page.locator('.preview-grid')).not.toContainText('English');
  await expect(page.locator('.hero-card')).toContainText('还有 1 个小芽需要照顾');
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  await expect(page.locator('.study-card h1')).toHaveText('apple');
  for (let index = 0; index < 5; index++) {
    const zh = await page.locator('.study-card h2').innerText();
    await page.getByRole('button', { name: '记住啦，来挑战' }).click();
    await expect(page.getByRole('button', { name: '选择英语', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: `选择${zh}`, exact: true }).click();
    await page.getByRole('button', { name: index === 4 ? '收获本轮成长' : '下一个单词' }).click();
  }
  await expect.poll(() => submissions.length).toBe(1);
  expect(submissions[0]).toMatchObject({
    words_learned: 4,
    words_reviewed: 1,
    mistakes_corrected: 1,
    points_earned: 55,
  });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordsprout:progress:v1:scope-test')!),
  );
  expect(saved.words.apple.needsReview).toBe(false);
  expect(saved.words.English.needsReview).toBe(true);
  expect(saved.points).toBe(85);
});
