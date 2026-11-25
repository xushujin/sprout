import type { Page } from '@playwright/test';

type QuizKind = 'picture' | 'reverse' | 'listen' | 'spell' | 'dialogue';

async function quizKind(page: Page): Promise<QuizKind> {
  const kind = await page.locator('.quiz-card').getAttribute('data-quiz');
  if (!kind) throw new Error('The quiz card has no question type.');
  return kind as QuizKind;
}

async function spell(page: Page, letters: string) {
  for (const letter of letters.toLowerCase()) {
    await page
      .locator('.spell-tiles button:not([disabled])')
      .filter({ hasText: new RegExp(`^${letter}$`) })
      .first()
      .click();
  }
}

// Answers whatever question type is on screen. Every round mixes four types,
// so end-to-end flows read the word during the study phase and pass it here.
export async function answerCorrectly(page: Page, word: string, zh: string) {
  const kind = await quizKind(page);
  if (kind === 'picture') {
    await page.getByRole('button', { name: `选择${zh}`, exact: true }).click();
    return;
  }
  if (kind === 'spell') {
    await spell(page, word);
    return;
  }
  await page.getByRole('button', { name: `选择${word}`, exact: true }).click();
}

export async function answerWrong(page: Page, word: string, zh: string) {
  const kind = await quizKind(page);
  if (kind === 'spell') {
    // Same tiles, wrong order: enough to miss the spelling without guessing.
    await spell(page, [...word.toLowerCase()].reverse().join(''));
    return;
  }
  const label = kind === 'picture' ? `选择${zh}` : `选择${word}`;
  const options = page.locator('.answer-option');
  const count = await options.count();
  for (let index = 0; index < count; index += 1) {
    if ((await options.nth(index).getAttribute('aria-label')) !== label) {
      await options.nth(index).click();
      return;
    }
  }
  throw new Error('Every option is correct; cannot answer wrong.');
}
