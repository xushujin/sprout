import { GENERAL_WORDS } from './curriculum-words.ts';
import type { Word } from './words.ts';

export interface PreschoolTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  wordIds: readonly string[];
}

// A project-authored pre-school pathway. It reuses the approved general vocabulary
// and its attributed MP3s; neither an official textbook nor a graded word list.
export const PRESCHOOL_THEMES: readonly PreschoolTheme[] = [
  {
    id: 'letters',
    name: '英语启蒙与问候',
    emoji: '🔊',
    description: '从 Hello、Hi 和身边熟悉的小伙伴开始听英语',
    wordIds: ['hi', 'hello', 'bye', 'thanks', 'please', 'sorry', 'ball', 'bear', 'panda', 'duck'],
  },
  {
    id: 'colors-shapes',
    name: '颜色与大小',
    emoji: '🎨',
    description: '找一找颜色，比一比大和小',
    wordIds: ['red', 'blue', 'yellow', 'green', 'black', 'white', 'pink', 'brown', 'big', 'small'],
  },
  {
    id: 'numbers',
    name: '数字与数量',
    emoji: '🔢',
    description: '从 One 数到 Ten，边看边数',
    wordIds: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  },
  {
    id: 'classroom',
    name: '课堂与书包',
    emoji: '🎒',
    description: '听、看、坐好，还有小书包里的文具',
    wordIds: ['book', 'pencil', 'schoolbag', 'listen', 'sit', 'stand', 'open', 'good', 'yes', 'no'],
  },
  {
    id: 'world',
    name: '我的身边',
    emoji: '🌳',
    description: '家人、动物和每天见到的小伙伴',
    wordIds: [
      'mother',
      'father',
      'family',
      'baby',
      'water',
      'sun',
      'moon',
      'bird',
      'rabbit',
      'flower',
    ],
  },
];

const general = new Map(GENERAL_WORDS.map((word) => [word.id, word]));
export const PRESCHOOL_THEMES_BY_ID = new Map(PRESCHOOL_THEMES.map((theme) => [theme.id, theme]));

export function preschoolWords(themeId: string): Word[] {
  const theme = PRESCHOOL_THEMES_BY_ID.get(themeId);
  if (!theme) throw new Error(`Unknown preschool theme: ${themeId}`);
  return theme.wordIds.map((id) => {
    const word = general.get(id);
    if (!word) throw new Error(`Preschool word is not in the approved general vocabulary: ${id}`);
    return { ...word, category: `幼小衔接 · ${theme.name}` };
  });
}

export const PRESCHOOL_WORDS = PRESCHOOL_THEMES.flatMap((theme) => preschoolWords(theme.id));
