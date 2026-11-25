// English keeps its word-based engine. Chinese and maths share this small,
// fixed-shape question contract so one screen, one timer and one scoring path
// can serve both without touching the Worker.
export type SubjectId = 'english' | 'chinese' | 'math';
export type LearningSubject = Exclude<SubjectId, 'english'>;
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

export interface SubjectQuestion {
  /** Stable identity used by the review pool, so a missed question comes back. */
  key: string;
  subject: LearningSubject;
  grade: Grade;
  /** Short label shown on the card and in the result list. */
  topic: string;
  prompt: string;
  note?: string;
  choices: string[];
  answer: string;
  explain: string;
  /** Pinyin and equations get a larger, airier treatment. */
  display?: 'text' | 'char' | 'pinyin' | 'formula';
}

export interface SubjectBook {
  id: string;
  subject: LearningSubject;
  grade: Grade;
  name: string;
  short: string;
  description: string;
  emoji: string;
}

export const SUBJECT_META: Record<
  SubjectId,
  { name: string; english: string; emoji: string; tagline: string }
> = {
  english: { name: '英语', english: 'ENGLISH', emoji: '🌱', tagline: '600 词 · 听读拼' },
  chinese: { name: '语文', english: 'CHINESE', emoji: '📖', tagline: '识字 · 词语 · 古诗' },
  math: { name: '数学', english: 'MATH', emoji: '🧮', tagline: '口算 · 规律 · 应用' },
};

export const SUBJECT_BOOKS: SubjectBook[] = [
  {
    id: 'chinese-g1',
    subject: 'chinese',
    grade: 1,
    name: '语文 · 一年级',
    short: '一年级',
    description: '拼音认字、量词与简单反义词',
    emoji: '🌱',
  },
  {
    id: 'chinese-g2',
    subject: 'chinese',
    grade: 2,
    name: '语文 · 二年级',
    short: '二年级',
    description: '多音字词、成语与古诗接句',
    emoji: '🌿',
  },
  {
    id: 'chinese-g3',
    subject: 'chinese',
    grade: 3,
    name: '语文 · 三年级',
    short: '三年级',
    description: '近义词、偏旁与诗句积累',
    emoji: '🌳',
  },
  {
    id: 'chinese-g4',
    subject: 'chinese',
    grade: 4,
    name: '语文 · 四年级',
    short: '四年级',
    description: '多音字、成语与修辞手法',
    emoji: '🌾',
  },
  {
    id: 'chinese-g5',
    subject: 'chinese',
    grade: 5,
    name: '语文 · 五年级',
    short: '五年级',
    description: '关联词、病句与文学常识',
    emoji: '🍁',
  },
  {
    id: 'chinese-g6',
    subject: 'chinese',
    grade: 6,
    name: '语文 · 六年级',
    short: '六年级',
    description: '综合辨析、修辞与名著常识',
    emoji: '🌲',
  },
  {
    id: 'math-g1',
    subject: 'math',
    grade: 1,
    name: '数学 · 一年级',
    short: '一年级',
    description: '20 以内加减、比大小与找规律',
    emoji: '🌱',
  },
  {
    id: 'math-g2',
    subject: 'math',
    grade: 2,
    name: '数学 · 二年级',
    short: '二年级',
    description: '表内乘除、单位换算与应用题',
    emoji: '🌿',
  },
  {
    id: 'math-g3',
    subject: 'math',
    grade: 3,
    name: '数学 · 三年级',
    short: '三年级',
    description: '多位数计算、周长面积与分数',
    emoji: '🌳',
  },
  {
    id: 'math-g4',
    subject: 'math',
    grade: 4,
    name: '数学 · 四年级',
    short: '四年级',
    description: '大数、三位数乘法与小数',
    emoji: '🌾',
  },
  {
    id: 'math-g5',
    subject: 'math',
    grade: 5,
    name: '数学 · 五年级',
    short: '五年级',
    description: '小数运算、因数倍数与方程',
    emoji: '🍁',
  },
  {
    id: 'math-g6',
    subject: 'math',
    grade: 6,
    name: '数学 · 六年级',
    short: '六年级',
    description: '分数、百分数、圆与圆柱',
    emoji: '🌲',
  },
];

export const subjectBooks = (subject: LearningSubject) =>
  SUBJECT_BOOKS.filter((book) => book.subject === subject);

export function findSubjectBook(id?: string, subject?: LearningSubject): SubjectBook {
  const known = SUBJECT_BOOKS.find(
    (book) => book.id === id && (!subject || book.subject === subject),
  );
  if (known) return known;
  return SUBJECT_BOOKS.find((book) => book.subject === (subject ?? 'chinese'))!;
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Small deterministic generator for authored questions: the same seed always
// gives the same option order, so tests and screenshots stay comparable.
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Picks `count` distinct items without repeating, using the supplied random. */
export function takeRandom<T>(items: readonly T[], count: number, random: () => number): T[] {
  return shuffle(items, random).slice(0, count);
}
