import { expect, test } from '@playwright/test';

test('MP3s play without browser speech support, including replay and retry after failure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: undefined,
      configurable: true,
    });
    const nativePlay = HTMLMediaElement.prototype.play;
    const events: string[] = [];
    const observed = new WeakSet<HTMLMediaElement>();
    (window as unknown as { audioPlayed: string[] }).audioPlayed = events;
    HTMLMediaElement.prototype.play = function () {
      if (!observed.has(this)) {
        this.addEventListener('playing', () => events.push(this.currentSrc));
        observed.add(this);
      }
      return nativePlay.call(this); // real browser decoding and playback
    };
  });
  await page.route('**/api/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'audio-test',
          username: 'audio-test',
          display_name: '声音小芽',
          role: 'student',
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '开始一轮学习' }).click();
  await page.getByRole('button', { name: '听一听发音' }).click();
  const played = () =>
    page.evaluate(() => (window as unknown as { audioPlayed: string[] }).audioPlayed);
  await expect.poll(played).toHaveLength(1);
  expect((await played())[0]).toContain('/audio/apple.mp3');
  await page.getByRole('button', { name: '记住啦，来挑战' }).click();
  await expect.poll(played).toHaveLength(2);
  await page.getByRole('button', { name: '再听一次发音' }).click();
  await expect.poll(played).toHaveLength(3);
  await page.getByRole('button', { name: '选择苹果', exact: true }).click();
  await page.getByRole('button', { name: '下一个单词' }).click();

  await page.route('**/audio/banana.mp3*', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await page.getByRole('button', { name: '听一听发音' }).click();
  await expect(page.getByText('音频暂时没播出，请点发音按钮再试一次。')).toBeVisible();
  await page.unroute('**/audio/banana.mp3*');
  await page.getByRole('button', { name: '听一听发音' }).click();
  await expect.poll(played).toHaveLength(4);
  expect((await played()).at(-1)).toContain('/audio/banana.mp3');
  await expect(page.getByText('音频暂时没播出，请点发音按钮再试一次。')).toHaveCount(0);

  // Exercise refreshed short-word and number recordings through the real player,
  // with system speech disabled. A new URL bypasses the previous audio cache.
  for (const [theme, word] of [
    ['英语启蒙与问候', 'hi'],
    ['数字与数量', 'one'],
  ] as const) {
    await page.goto('/');
    const picker = page.getByRole('region', { name: '选择学习词库' });
    await picker.getByRole('tab', { name: '幼小衔接' }).click();
    await picker.getByRole('button', { name: new RegExp(`^${theme}`) }).click();
    await page.getByRole('button', { name: '开始一轮学习' }).click();
    await expect(page.locator('.study-card h1')).toHaveText(word);
    await page.getByRole('button', { name: '听一听发音' }).click();
    await expect.poll(played).toHaveLength(1);
    const playedUrl = new URL((await played())[0]);
    expect(playedUrl.pathname).toBe(`/audio/${word}.mp3`);
    expect(playedUrl.searchParams.get('v')).toBe('3');
    await expect(page.getByText('音频暂时没播出，请点发音按钮再试一次。')).toHaveCount(0);
  }

  const words = (await (await page.request.get('/audio/sources.json')).json()).map(
    (item: { word: string }) => item.word,
  );
  expect(words).toHaveLength(600);
  // Decode every retained audio file, not retired textbook examples.
  const lengths = await page.evaluate(async (ids) => {
    const context = new AudioContext();
    try {
      return await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/audio/${id}.mp3`);
          const decoded = await context.decodeAudioData(await response.arrayBuffer());
          return decoded.duration;
        }),
      );
    } finally {
      await context.close();
    }
  }, words);
  expect(lengths).toHaveLength(words.length);
  for (const length of lengths) expect(length).toBeGreaterThan(0.2);
});
