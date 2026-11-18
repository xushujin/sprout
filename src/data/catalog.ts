import type { Word } from './words';
import { GENERAL_GRADES, GENERAL_WORDS_BY_GRADE, GRADE_BANDS } from './general-words';
import { PRESCHOOL_THEMES, PRESCHOOL_THEMES_BY_ID, preschoolWords } from './preschool';
import { TOPIC_PACKS, TOPIC_PACKS_BY_ID, topicWords } from './topics';

export type BookMode = 'grade' | 'level' | 'preschool' | 'theme';
export interface Book {
  id: string;
  name: string;
  mode: BookMode;
  count: number;
  added: number;
  grade?: number;
  description: string;
  theme?: string;
}
export const GRADE_LABELS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const levels = [
  { id: 'beginner', name: '入门', grades: [1, 2], description: '从图片、身边事物开始' },
  {
    id: 'basic',
    name: '基础',
    grades: [1, 2, 3, 4],
    description: '在入门基础上加入食物、动作和天气',
  },
  {
    id: 'advanced',
    name: '进阶',
    grades: [1, 2, 3, 4, 5, 6],
    description: '覆盖全部 600 词，延伸时间与抽象概念',
  },
];
export const BOOKS: Book[] = [
  ...GENERAL_GRADES.map((grade) => ({
    id: `grade-${grade}`,
    name: `${GRADE_LABELS[grade - 1]}课标参考`,
    mode: 'grade' as const,
    grade,
    count: GENERAL_WORDS_BY_GRADE[grade].length,
    added: GRADE_BANDS[grade].length,
    description: '累计学习，按课标范围自主分级',
  })),
  ...PRESCHOOL_THEMES.map((theme) => ({
    id: `preschool-${theme.id}`,
    name: `幼小衔接 · ${theme.name}`,
    mode: 'preschool' as const,
    theme: theme.id,
    count: theme.wordIds.length,
    added: theme.wordIds.length,
    description: theme.description,
  })),
  ...TOPIC_PACKS.map((pack) => ({
    id: `topic-${pack.id}`,
    name: `主题包 · ${pack.name}`,
    mode: 'theme' as const,
    theme: pack.id,
    count: pack.wordIds.length,
    added: pack.wordIds.length,
    description: pack.description,
  })),
  ...levels.map((level) => ({
    id: `level-${level.id}`,
    name: `${level.name}词库`,
    mode: 'level' as const,
    added: GRADE_BANDS[level.grades.at(-1)!].length,
    count: level.grades.reduce((total, grade) => total + GRADE_BANDS[grade].length, 0),
    description: level.description,
  })),
];
export const DEFAULT_BOOK_ID = 'grade-1';
export function findBook(id?: string) {
  const known = BOOKS.find((book) => book.id === id);
  if (known) return known;
  // Only migrate the old selection, never erase learned-word history or outbox.
  const retiredGrade = id?.match(/^fltrp-([3-6])-[12]$/)?.[1];
  return BOOKS.find((book) => book.id === `grade-${retiredGrade}`) ?? BOOKS[0];
}

export async function loadBookWords(book: Book, _signal?: AbortSignal): Promise<Word[]> {
  if (book.mode === 'grade') return GENERAL_WORDS_BY_GRADE[book.grade!];
  if (book.mode === 'level')
    return levels
      .find((level) => `level-${level.id}` === book.id)!
      .grades.flatMap((grade) => GRADE_BANDS[grade]);
  if (book.mode === 'preschool' && PRESCHOOL_THEMES_BY_ID.has(book.theme!))
    return preschoolWords(book.theme!);
  if (book.mode === 'theme' && TOPIC_PACKS_BY_ID.has(book.theme!)) return topicWords(book.theme!);
  throw new Error('该词库已不可用，请选择通用练习。');
}

// Grade and level books share one progress scope; themed collections keep their
// own review pool so a mistake in 动物朋友 does not leak into 校园一天.
export function scopeFor(book: Book): string {
  return book.mode === 'grade' || book.mode === 'level' ? 'general' : book.id;
}
