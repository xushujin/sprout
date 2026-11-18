import { describe, expect, it } from 'vitest';
import { GENERAL_WORDS_BY_GRADE } from '../src/data/curriculum-words';
import { PRESCHOOL_THEMES, preschoolWords } from '../src/data/preschool';
import { optionsFor } from '../src/lib/progress';
import type { Word } from '../src/data/words';

const word = (id: string, zh: string, emoji: string): Word => ({
  id,
  en: id,
  zh,
  emoji,
  phonetic: '',
  category: 'test',
});
const visual = (item: Word) => item.image || item.emoji || `letter:${item.en.charAt(0)}`;

describe('quiz options', () => {
  it('keeps every grade 1 word visually unique', () => {
    const grade1 = GENERAL_WORDS_BY_GRADE[1];
    expect(new Set(grade1.map(visual)).size).toBe(grade1.length);
  });

  it('never repeats a picture or label inside one question', () => {
    const words = [
      word('hi', '嗨', '👋'),
      word('hello', '你好', '👋'),
      word('bye', '再见', '👋'),
      word('thanks', '谢谢', '🙏'),
      word('apple', '苹果', '🍎'),
      word('cat', '猫', '🐱'),
      word('dog', '狗', '🐶'),
    ];
    for (let i = 0; i < 100; i += 1) {
      const options = optionsFor(words[0], words);
      expect(options).toHaveLength(3);
      expect(new Set(options.map(visual)).size).toBe(3);
      expect(new Set(options.map((item) => item.zh)).size).toBe(3);
    }
  });

  it('keeps three distinct pictures in every book', () => {
    const books = [1, 2, 3, 4, 5, 6].map((grade) => GENERAL_WORDS_BY_GRADE[grade]);
    books.push(...PRESCHOOL_THEMES.map((theme) => preschoolWords(theme.id)));
    for (const words of books) {
      for (const target of words) {
        const options = optionsFor(target, words);
        expect(options).toHaveLength(3);
        expect(new Set(options.map(visual)).size).toBe(3);
      }
    }
  });

  it('still fills three options when every distractor shares one picture', () => {
    const words = [word('hi', '嗨', '👋'), word('hello', '你好', '👋'), word('bye', '再见', '👋')];
    expect(optionsFor(words[0], words)).toHaveLength(3);
  });
});
