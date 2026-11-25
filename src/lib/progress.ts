import type { ScoreEvent } from '../../shared/types';
import { WORDS, type Word } from '../data/words';
import { dialogueFor, type DialogueEntry } from '../data/dialogues';
import { quizKindAt, type QuizKind } from './quiz';

interface WordProgress {
  seen: number;
  correct: number;
  needsReview: boolean;
  lastSeen: number;
}
export interface Progress {
  version: 1;
  bookId?: string;
  sound?: { music: boolean; effects: boolean };
  words: Record<string, WordProgress>;
  // Preschool themes and topic packs intentionally combine general vocabulary in
  // different contexts. Keep their mistakes separate from general-round progress;
  // the map is keyed by book id, so each collection has a stable review pool.
  preschoolWords?: Record<string, Record<string, WordProgress>>;
  pending: ScoreEvent[];
  rounds: number;
  points: number;
  correct: number;
  answered: number;
  recentRoundIds: string[];
}
export interface RoundWord {
  word: Word;
  isNew: boolean;
  wasMistake: boolean;
  quiz: QuizKind;
  /** Present only when the question type is a dialogue. */
  dialogue?: DialogueEntry;
}
const memory = new Map<string, Progress>();
const unsaved = new Set<string>();
let durable = true;
export const storageIsDurable = () => durable;
const key = (userId: string) => `wordsprout:progress:v1:${userId}`;
export const emptyProgress = (): Progress => ({
  version: 1,
  words: {},
  pending: [],
  rounds: 0,
  points: 0,
  correct: 0,
  answered: 0,
  recentRoundIds: [],
});

export function readProgress(userId: string): Progress {
  if (unsaved.has(userId)) return structuredClone(memory.get(userId)!);
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return structuredClone(memory.get(userId) ?? emptyProgress());
    const data = JSON.parse(raw) as Progress;
    if (
      data.version !== 1 ||
      !data.words ||
      !Array.isArray(data.pending) ||
      !Array.isArray(data.recentRoundIds)
    )
      return emptyProgress();
    return data;
  } catch {
    durable = false;
    return structuredClone(memory.get(userId) ?? emptyProgress());
  }
}

// Spending reduces the local growth points immediately so the home sunflower
// reflects the new stage; pending rounds keep their own points until synced.
export function spendPoints(userId: string, amount: number): Progress {
  const current = readProgress(userId);
  return save(userId, { ...current, points: Math.max(0, current.points - amount) });
}

function save(userId: string, progress: Progress) {
  memory.set(userId, structuredClone(progress));
  try {
    localStorage.setItem(key(userId), JSON.stringify(progress));
    unsaved.delete(userId);
    durable = true;
  } catch {
    unsaved.add(userId);
    durable = false;
  }
  window.dispatchEvent(new Event('wordsprout:progress'));
  return progress;
}

async function locked<T>(userId: string, callback: () => T | Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request(key(userId), callback);
  return callback();
}

export function makeRound(
  progress: Progress,
  words: Word[] = WORDS,
  scope = 'general',
): RoundWord[] {
  const states = scope === 'general' ? progress.words : (progress.preschoolWords?.[scope] ?? {});
  return [...words]
    .sort((a, b) => {
      const pa = states[a.id],
        pb = states[b.id];
      const priority = (p?: WordProgress) => (p?.needsReview ? 0 : !p?.seen ? 1 : 2);
      return priority(pa) - priority(pb) || (pa?.lastSeen ?? 0) - (pb?.lastSeen ?? 0);
    })
    .slice(0, 5)
    .map((word, index) => {
      const quiz = quizKindAt(scope, index, word);
      return {
        word,
        isNew: !states[word.id]?.seen,
        wasMistake: !!states[word.id]?.needsReview,
        quiz,
        dialogue: quiz === 'dialogue' ? dialogueFor(scope, word.id) : undefined,
      };
    });
}

export function optionsFor(word: Word, words: Word[] = WORDS, mode: 'zh' | 'en' = 'zh'): Word[] {
  const shuffle = (list: Word[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  // Several words can share one emoji (weekdays, greetings), so picture options
  // must also be distinct by picture; English options must be distinct by word.
  const visual = (item: Word) => item.image || item.emoji || `letter:${item.en.charAt(0)}`;
  const label = (item: Word) => (mode === 'en' ? item.en.toLowerCase() : item.zh);
  const other = shuffle(words.filter((w) => w.id !== word.id));
  const seenLabels = new Set([label(word)]);
  const seenVisual = new Set([visual(word)]);
  const chosen: Word[] = [];
  const take = (allowSharedVisual: boolean) => {
    for (const item of other) {
      if (chosen.length === 2) return;
      if (chosen.some((picked) => picked.id === item.id)) continue;
      if (seenLabels.has(label(item))) continue;
      if (mode === 'zh' && !allowSharedVisual && seenVisual.has(visual(item))) continue;
      chosen.push(item);
      seenLabels.add(label(item));
      seenVisual.add(visual(item));
    }
  };
  take(false);
  // A tiny custom list may not hold two different pictures; still fill 3 options.
  if (chosen.length < 2) take(true);
  return shuffle([word, ...chosen]);
}

export async function selectBook(userId: string, bookId: string) {
  return locked(userId, () => save(userId, { ...readProgress(userId), bookId }));
}

export async function saveSoundPreferences(
  userId: string,
  sound: { music: boolean; effects: boolean },
) {
  return locked(userId, () => save(userId, { ...readProgress(userId), sound }));
}

export async function completeRound(
  userId: string,
  id: string,
  round: RoundWord[],
  answers: boolean[],
  scope = 'general',
) {
  return locked(userId, () => {
    const progress = readProgress(userId);
    if (progress.recentRoundIds.includes(id)) return progress;
    if (round.length !== 5 || answers.length !== 5) throw new Error('Incomplete round');
    const learned = round.filter((r) => r.isNew).length;
    const correct = answers.filter(Boolean).length;
    const repaired = round.filter((r, i) => r.wasMistake && answers[i]).length;
    const event: ScoreEvent = {
      id,
      words_learned: learned,
      words_reviewed: 5 - learned,
      correct_count: correct,
      total_count: 5,
      mistakes_corrected: repaired,
      points_earned: correct * 10 + repaired * 5,
    };
    const states = scope === 'general' ? progress.words : (progress.preschoolWords?.[scope] ?? {});
    for (const [i, item] of round.entries()) {
      const old = states[item.word.id];
      states[item.word.id] = {
        seen: (old?.seen ?? 0) + 1,
        correct: (old?.correct ?? 0) + Number(answers[i]),
        needsReview: !answers[i],
        lastSeen: Date.now(),
      };
    }
    if (scope !== 'general') (progress.preschoolWords ??= {})[scope] = states;
    progress.rounds += 1;
    progress.points += event.points_earned;
    progress.correct += correct;
    progress.answered += 5;
    progress.pending.push(event);
    progress.recentRoundIds = [...progress.recentRoundIds.slice(-19), id];
    return save(userId, progress);
  });
}

export async function acknowledge(userId: string, id: string) {
  return locked(userId, () => {
    const progress = readProgress(userId);
    progress.pending = progress.pending.filter((event) => event.id !== id);
    return save(userId, progress);
  });
}

export function lastUsername(value?: string) {
  try {
    if (value === '') localStorage.removeItem('wordsprout:last-username');
    else if (value !== undefined) localStorage.setItem('wordsprout:last-username', value);
    return localStorage.getItem('wordsprout:last-username') ?? '';
  } catch {
    return '';
  }
}
