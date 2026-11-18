import type { Word } from '../data/words';

// Four question shapes share one round contract: each word still ends with a
// single right/wrong answer, so scoring and the Worker API stay unchanged.
export type QuizKind = 'picture' | 'reverse' | 'listen' | 'spell';

export const QUIZ_SECONDS: Record<QuizKind, number> = {
  picture: 15,
  reverse: 15,
  listen: 15,
  spell: 30,
};

// A round ramps from recognition to production: recognise the meaning, recall
// the English, hear it, then build it. Every plan starts with the classic
// picture question so a round always opens with something familiar.
const GENERAL_PLAN: readonly QuizKind[] = ['picture', 'reverse', 'listen', 'spell', 'picture'];
const PRESCHOOL_PLAN: readonly QuizKind[] = ['picture', 'listen', 'picture', 'reverse', 'picture'];

export function quizPlan(scope: string): readonly QuizKind[] {
  return scope.startsWith('preschool') ? PRESCHOOL_PLAN : GENERAL_PLAN;
}

export function canSpell(word: Word): boolean {
  // Letter tiles must stay readable on a 393px phone: 3–8 plain letters only.
  // Hyphenated entries (ice-cream) and very long words fall back to another type.
  if (!/^[a-z]{3,8}$/i.test(word.en)) return false;
  return new Set(word.en.toLowerCase()).size > 1;
}

export function quizKindAt(scope: string, index: number, word: Word): QuizKind {
  const kind = quizPlan(scope)[index] ?? 'picture';
  return kind === 'spell' && !canSpell(word) ? 'reverse' : kind;
}

export interface LetterTile {
  id: string;
  letter: string;
}

const DISTRACTOR_POOL = [...'abcdefghijklmnopqrstuvwxyz'];

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// The word's own letters plus two decoys. Keys are unique so a repeated letter
// (apple) still produces two tappable tiles.
export function spellingTiles(word: Word, random: () => number = Math.random): LetterTile[] {
  const letters = word.en.toLowerCase().split('');
  const used = new Set(letters);
  const decoys = shuffle(
    DISTRACTOR_POOL.filter((letter) => !used.has(letter)),
    random,
  ).slice(0, 2);
  return shuffle(
    [...letters, ...decoys].map((letter, index) => ({ id: `${letter}-${index}`, letter })),
    random,
  );
}

export function spellAttempt(tiles: LetterTile[], picked: number[]): string {
  return picked.map((index) => tiles[index]?.letter ?? '').join('');
}

export function quizPrompt(kind: QuizKind, phase: 'quiz' | 'feedback', correct: boolean): string {
  if (phase === 'feedback') return correct ? '答对啦，真棒！' : '没关系，再记住它！';
  if (kind === 'picture') return '听一听，选出正确的意思';
  if (kind === 'reverse') return '看中文，选出对应的英文';
  if (kind === 'listen') return '听发音，选出听到的单词';
  return '看图片，把单词拼出来';
}

export function quizHint(kind: QuizKind): string {
  if (kind === 'picture') return '也可以看单词来选择 · 每题 15 秒';
  if (kind === 'reverse') return '看中文想英文 · 每题 15 秒';
  if (kind === 'listen') return '听不清可以再点一次 · 每题 15 秒';
  return '点字母填空，填满自动判断 · 30 秒';
}
