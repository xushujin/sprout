import { expect, test, type Page, type Locator } from '@playwright/test';

const screens = [
  {
    name: 'ipad-mini',
    portrait: { width: 768, height: 1024 },
    landscape: { width: 1024, height: 768 },
  },
  {
    name: 'ipad-air',
    portrait: { width: 820, height: 1180 },
    landscape: { width: 1180, height: 820 },
  },
  {
    name: 'ipad-pro',
    portrait: { width: 1024, height: 1366 },
    landscape: { width: 1366, height: 1024 },
  },
  {
    name: 'android-tablet',
    portrait: { width: 800, height: 1280 },
    landscape: { width: 1280, height: 800 },
  },
  {
    name: 'split-view',
    portrait: { width: 600, height: 960 },
    landscape: { width: 960, height: 600 },
  },
];

async function noPageOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    visual: window.visualViewport?.width ?? innerWidth,
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
  // Overflow can make a mobile browser scale the entire page to fit.
  expect(Math.abs(metrics.visual - page.viewportSize()!.width)).toBeLessThan(2);
}

async function touchTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(locator).toBeInViewport();
}

async function fieldsFit(page: Page) {
  const sizes = await page.locator('input:not([type=checkbox]), select').evaluateAll((fields) =>
    fields.map((field) => ({
      size: Number.parseFloat(getComputedStyle(field).fontSize),
      width: field.getBoundingClientRect().width,
    })),
  );
  for (const size of sizes) {
    expect(size.size).toBeGreaterThanOrEqual(16); // Avoid iPad Safari focus zoom.
    expect(size.width).toBeGreaterThanOrEqual(180);
  }
}

for (const screen of screens) {
  test(`${screen.name}: portrait, landscape, active-round rotation and teacher controls`, async ({
    page,
  }, info) => {
    let role: 'guest' | 'student' | 'admin' = 'guest';
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const notes: number[] = [];
      (window as unknown as { layoutSoundNotes: number[] }).layoutSoundNotes = notes;
      const create = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        const voice = create.call(this);
        let frequency = voice.frequency.value;
        const schedule = voice.frequency.setValueAtTime.bind(voice.frequency);
        const start = voice.start.bind(voice);
        voice.frequency.setValueAtTime = (value, time) => {
          frequency = value;
          return schedule(value, time);
        };
        // WebKit applies a scheduled frequency only when its timestamp arrives;
        // record the actual scheduled note without reading the default 440 Hz.
        voice.start = (when) => {
          notes.push(frequency);
          start(when);
        };
        return voice;
      };
    });
    const nickname = '一起长大的平板小芽';
    const student = {
      id: 'tablet-student',
      username: 'student-with-a-long-name-12345678',
      display_name: nickname,
      role: 'student',
      created_at: 1,
      rounds: 3,
      words_learned: 12,
      words_reviewed: 3,
      correct_count: 12,
      total_count: 15,
      points: 125,
      last_active: 1,
    };
    await page.route('**/api/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me')
        return route.fulfill(
          role === 'guest'
            ? { status: 401, json: { error: '请先登录。' } }
            : {
                json: {
                  user: {
                    id: `tablet-${role}`,
                    username: `tablet-${role}`,
                    display_name: role === 'admin' ? '平板老师' : nickname,
                    role,
                    // A saved avatar keeps the student on the garden instead of
                    // the first-time avatar editor.
                    ...(role === 'student'
                      ? {
                          points: 125,
                          owned_items: [],
                          avatar: { gender: 'girl', hair: 'bob', skin: 'tan', outfit: 'dress' },
                        }
                      : {}),
                  },
                },
              },
        );
      if (path === '/api/leaderboard')
        return route.fulfill({
          json: {
            week_start: '2026-11-09',
            generated_at: Date.now(),
            entries: [{ display_name: nickname.repeat(2).slice(0, 20), rounds: 31, points: 1250 }],
          },
        });
      if (path === '/api/admin/students')
        return route.fulfill({ json: { students: [student], next_cursor: null } });
      if (path === `/api/admin/students/${student.id}` && route.request().method() === 'PATCH')
        return route.fulfill({
          json: { ok: true, display_name: route.request().postDataJSON().display_name },
        });
      return route.fulfill({ json: { ok: true, accepted: true } });
    });
    const shot = async (label: string) =>
      page.screenshot({ path: info.outputPath(`${label}.png`), fullPage: true });

    await page.setViewportSize(screen.portrait);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '你好，小小探索家' })).toBeVisible();
    await shot('login-portrait');
    await noPageOverflow(page);
    await fieldsFit(page);
    await page.getByLabel('用户名', { exact: true }).fill('tablet-visitor');
    await page.setViewportSize(screen.landscape);
    await expect(page.getByLabel('用户名', { exact: true })).toHaveValue('tablet-visitor');
    await touchTarget(page.getByRole('button', { name: '进入我的花园' }));
    await noPageOverflow(page);

    role = 'student';
    await page.setViewportSize(screen.portrait);
    await page.goto('/');
    await expect(page.getByRole('button', { name: '开始一轮学习' })).toBeEnabled();
    await shot('garden-portrait');
    await noPageOverflow(page);
    const picker = page.getByRole('region', { name: '选择学习词库' });
    const pickerBox = await picker.boundingBox();
    expect(pickerBox!.width).toBeGreaterThanOrEqual(screen.portrait.width * 0.85);
    await touchTarget(page.getByRole('button', { name: '退出登录' }));
    await touchTarget(picker.getByRole('button', { name: '六年级' }));
    await picker.getByRole('button', { name: '六年级' }).tap();
    await expect(page.locator('.preview-card h3').first()).toHaveText('apple');
    await expect(picker.getByRole('tab')).toHaveCount(4);
    await picker.getByRole('tab', { name: '主题包' }).tap();
    await picker.getByRole('button', { name: /^动物朋友/ }).tap();
    await expect(page.locator('.preview-card h3').first()).toHaveText('cat');
    await noPageOverflow(page);
    await picker.getByRole('tab', { name: '幼小衔接' }).tap();
    await expect(picker.getByText('先听声音，再认一认')).toBeVisible();
    await picker.getByRole('button', { name: /^数字与数量/ }).tap();
    await expect(page.locator('.preview-card h3').first()).toHaveText('one');
    await page.setViewportSize(screen.landscape);
    await shot('preschool-landscape');
    await noPageOverflow(page);
    await expect(picker.getByRole('button', { name: /^数字与数量/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.setViewportSize(screen.portrait);
    await shot('preschool-portrait');
    await noPageOverflow(page);
    await picker.getByRole('tab', { name: '按年级' }).tap();
    await picker.getByRole('button', { name: '六年级' }).tap();
    await page.setViewportSize(screen.landscape);
    await shot('garden-landscape');
    await noPageOverflow(page);
    await expect(picker.getByRole('button', { name: '六年级' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: '开始一轮学习' }).tap();
    await expect(page.locator('.study-card h1')).toHaveText('apple');
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { layoutSoundNotes: number[] }).layoutSoundNotes.length,
        ),
      )
      .toBeGreaterThan(0);
    await touchTarget(page.getByRole('button', { name: '返回首页', exact: true }));
    await touchTarget(page.getByRole('button', { name: '背景音乐', exact: true }));
    await touchTarget(page.getByRole('button', { name: '听一听发音' }));
    await shot('study-landscape');
    await page.setViewportSize(screen.portrait);
    await expect(page.locator('.study-card h1')).toHaveText('apple');
    await page.getByRole('button', { name: '记住啦，来挑战' }).tap();
    await touchTarget(page.locator('.answer-option').first());
    await page.getByRole('button', { name: '选择苹果', exact: true }).tap();
    await expect(page.getByText('答对啦，真棒！')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { layoutSoundNotes: number[] }).layoutSoundNotes.includes(659.25),
        ),
      )
      .toBe(true);
    await page.setViewportSize(screen.landscape);
    await noPageOverflow(page);
    await touchTarget(page.getByRole('button', { name: '下一个单词' }));
    await shot('feedback-landscape');
    await page.getByRole('button', { name: '返回首页', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await noPageOverflow(page);
    await touchTarget(page.getByRole('button', { name: '继续本轮' }));
    await shot('return-dialog');
    await page.getByRole('button', { name: '继续本轮' }).tap();
    await page.getByRole('button', { name: '下一个单词' }).tap();
    await expect(page.locator('.study-card h1')).toHaveText('banana');

    await page.goto('/leaderboard');
    await expect(page.locator('.ranking-list')).toBeVisible();
    await touchTarget(page.getByRole('button', { name: '刷新排行榜' }));
    await page.setViewportSize(screen.portrait);
    await noPageOverflow(page);
    await shot('leaderboard-portrait');

    role = 'admin';
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: '重置密码' })).toBeVisible();
    await page.getByLabel('用户名', { exact: true }).fill('tablet-account');
    await fieldsFit(page);
    await noPageOverflow(page);
    await shot('admin-portrait');
    await touchTarget(page.getByRole('button', { name: '修改昵称' }));
    await page.getByRole('button', { name: '修改昵称' }).tap();
    await fieldsFit(page);
    await touchTarget(page.getByRole('button', { name: '保存昵称' }));
    await page.getByLabel(`为${nickname}设置新昵称`).fill('平板小太阳');
    await page.getByRole('button', { name: '保存昵称' }).tap();
    await expect(
      page.getByRole('cell', { name: '平板小太阳 student-with-a-long-name-12345678' }),
    ).toBeVisible();
    await page.getByRole('button', { name: '重置密码' }).tap();
    await fieldsFit(page);
    await touchTarget(page.getByRole('button', { name: '确认重置' }));
    await page.setViewportSize(screen.landscape);
    await noPageOverflow(page);
    await expect(page.getByLabel('用户名', { exact: true })).toHaveValue('tablet-account');
    await shot('admin-landscape');
    expect(errors).toEqual([]);
  });
}
