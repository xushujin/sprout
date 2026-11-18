import { expect, test } from '@playwright/test';
import { answerCorrectly, answerWrong } from './quiz-helper';

test('starts music on tap, ducks for speech, distinguishes feedback, and exits without losing saved progress', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext;
    const probe = {
      notes: [] as { frequency: number; type: OscillatorType }[],
      contexts: [] as AudioContext[],
      gains: [] as number[],
    };
    (window as unknown as { soundProbe: typeof probe }).soundProbe = probe;
    class ObservedContext extends NativeContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts.push(this);
      }
      createOscillator() {
        const voice = super.createOscillator();
        const start = voice.start.bind(voice);
        voice.start = (at?: number) => {
          probe.notes.push({ frequency: voice.frequency.value, type: voice.type });
          start(at);
        };
        return voice;
      }
      createGain() {
        const gain = super.createGain();
        const target = gain.gain.setTargetAtTime.bind(gain.gain);
        gain.gain.setTargetAtTime = (value, time, constant) => {
          probe.gains.push(value);
          return target(value, time, constant);
        };
        return gain;
      }
    }
    window.AudioContext = ObservedContext;
  });
  await page.route('**/api/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'sound-test',
          username: 'sound-test',
          display_name: '节奏小芽',
          role: 'student',
        },
      },
    }),
  );
  let submissions = 0;
  await page.route('**/api/scores', (route) => {
    submissions++;
    return route.fulfill({ json: { ok: true, accepted: true } });
  });
  await page.goto('/');
  const notes = () =>
    page.evaluate(
      () => (window as unknown as { soundProbe: { notes: unknown[] } }).soundProbe.notes,
    );
  const resetNotes = () =>
    page.evaluate(() => {
      (window as unknown as { soundProbe: { notes: unknown[] } }).soundProbe.notes = [];
    });
  expect(await notes()).toHaveLength(0);
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  await expect.poll(async () => (await notes()).length).toBeGreaterThan(2);
  await page.getByRole('button', { name: '听一听发音' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const values = (window as unknown as { soundProbe: { gains: number[] } }).soundProbe.gains;
        return values.some((value) => value > 0 && value < 0.02);
      }),
    )
    .toBe(true);

  await page.getByRole('button', { name: '背景音乐', exact: true }).click();
  await expect(page.getByRole('button', { name: '背景音乐', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await resetNotes();
  await page.getByRole('button', { name: '记住啦，来挑战' }).click();
  await answerCorrectly(page, 'apple', '苹果');
  const correctSound = await notes();
  expect(correctSound.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: '下一个单词' }).click();
  await resetNotes();
  await page.getByRole('button', { name: '记住啦，来挑战' }).click();
  await answerWrong(page, 'banana', '香蕉');
  const wrongSound = await notes();
  expect(wrongSound.length).toBeGreaterThan(0);
  expect(wrongSound).not.toEqual(correctSound);
  await page.getByRole('button', { name: '答题音效', exact: true }).click();
  await page.getByRole('button', { name: '下一个单词' }).click();
  await resetNotes();
  for (const [i, pair] of (
    [
      ['orange', '橙子'],
      ['grape', '葡萄'],
      ['pear', '梨'],
    ] as const
  ).entries()) {
    await page.getByRole('button', { name: '记住啦，来挑战' }).click();
    await answerCorrectly(page, ...pair);
    await page.getByRole('button', { name: i === 2 ? '收获本轮成长' : '下一个单词' }).click();
  }
  await expect(page.locator('.result-card')).toBeVisible();
  await expect.poll(() => submissions).toBe(1);
  expect(await notes()).toHaveLength(0);
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始一轮学习' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '背景音乐', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('button', { name: '答题音效', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const saved = await page.evaluate(() =>
    localStorage.getItem('wordsprout:progress:v1:sound-test'),
  );
  expect(JSON.parse(saved!).points).toBe(40);

  await page.getByRole('button', { name: '开始一轮学习' }).click();
  await page.getByRole('button', { name: '记住啦，来挑战' }).click();
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '继续本轮' })).toBeFocused();
  await page.getByRole('button', { name: '继续本轮' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  await page.getByRole('button', { name: '确认返回首页' }).click();
  await expect(page.getByRole('button', { name: '开始一轮学习' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('wordsprout:progress:v1:sound-test'))).toBe(
    saved,
  );
  expect(submissions).toBe(1);
});

test('return dialog pauses the timer; cancel resumes, timeout plays failure, and home stops music', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const starts: number[] = [];
    const stops: number[] = [];
    (
      window as unknown as { oscillatorProbe: { starts: number[]; stops: number[] } }
    ).oscillatorProbe = { starts, stops };
    const originalStart = OscillatorNode.prototype.start;
    const originalStop = OscillatorNode.prototype.stop;
    OscillatorNode.prototype.start = function (when) {
      starts.push(this.frequency.value);
      originalStart.call(this, when);
    };
    OscillatorNode.prototype.stop = function (when) {
      if (when === undefined) stops.push(this.frequency.value);
      originalStop.call(this, when);
    };
  });
  await page.route('**/api/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'timer-test',
          username: 'timer-test',
          display_name: '计时小芽',
          role: 'student',
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  await page.clock.runFor(300);
  await page.getByRole('button', { name: '记住啦，来挑战' }).click();
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  const remaining = await page.locator('.timer').innerText();
  await page.clock.fastForward(20_000);
  await expect(page.locator('.timer')).toHaveText(remaining);
  await page.getByRole('button', { name: '继续本轮' }).click();
  await page.clock.runFor(1000);
  await expect(page.locator('.timer')).not.toHaveText(remaining);
  await page.getByRole('button', { name: '背景音乐', exact: true }).click();
  await page.evaluate(() => {
    (window as unknown as { oscillatorProbe: { starts: number[] } }).oscillatorProbe.starts.length =
      0;
  });
  await page.clock.fastForward(15_000);
  await expect(page.getByText('没关系，再记住它！')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { oscillatorProbe: { starts: number[] } }).oscillatorProbe.starts
          .length,
    ),
  ).toBeGreaterThan(0);
  await page.getByRole('button', { name: '背景音乐', exact: true }).click();
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  await page.getByRole('button', { name: '确认返回首页' }).click();
  const noteCount = await page.evaluate(
    () =>
      (window as unknown as { oscillatorProbe: { starts: number[] } }).oscillatorProbe.starts
        .length,
  );
  await page.clock.fastForward(10_000);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { oscillatorProbe: { starts: number[] } }).oscillatorProbe.starts
          .length,
    ),
  ).toBe(noteCount);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { oscillatorProbe: { stops: number[] } }).oscillatorProbe.stops
          .length,
    ),
  ).toBeGreaterThan(0);
});
