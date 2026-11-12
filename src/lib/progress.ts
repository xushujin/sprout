import type { ScoreEvent } from '../../shared/types';
import { WORDS, type Word } from '../data/words';

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
  // Preschool topics intentionally combine general vocabulary in different contexts.
  // Keep their mistakes separate from general-round progress; IDs remain stable per topic.
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
    .map((word) => ({
      word,
      isNew: !states[word.id]?.seen,
      wasMistake: !!states[word.id]?.needsReview,
    }));
}

export function optionsFor(word: Word, words: Word[] = WORDS): Word[] {
  const shuffle = (list: Word[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  // Avoid identical Chinese labels for synonyms/conjugations in textbook lists.
  const other = shuffle(words.filter((w) => w.id !== word.id && w.zh !== word.zh));
  const seen = new Set([word.zh]);
  const distinct = other.filter((item) => {
    if (seen.has(item.zh)) return false;
    seen.add(item.zh);
    return true;
  });
  return shuffle([word, ...distinct.slice(0, 2)]);
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
