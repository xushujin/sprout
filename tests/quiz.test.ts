import { describe, expect, it } from 'vitest';
import { GENERAL_WORDS, GRADE_BANDS } from '../src/data/curriculum-words';
import { BOOKS, findBook, loadBookWords, scopeFor } from '../src/data/catalog';
import { PRESCHOOL_THEMES, preschoolWords } from '../src/data/preschool';
import { TOPIC_PACKS, TOPIC_PACKS_BY_ID, topicWords } from '../src/data/topics';
import { DIALOGUES, dialogueFor, dialogueOptions } from '../src/data/dialogues';
import {
  QUIZ_SECONDS,
  canSpell,
  quizKindAt,
  quizPlan,
  spellAttempt,
  spellingTiles,
} from '../src/lib/quiz';
import { optionsFor } from '../src/lib/progress';
import type { Word } from '../src/data/words';

const word = (en: string, zh: string, emoji = '🙂'): Word => ({
  id: en.toLowerCase(),
  en,
  zh,
  emoji,
  phonetic: '',
  category: 'test',
});

describe('topic packs', () => {
  it('offers eight self-authored packs of twenty approved words', () => {
    expect(TOPIC_PACKS).toHaveLength(8);
    const approved = new Set(GENERAL_WORDS.map((item) => item.id));
    for (const pack of TOPIC_PACKS) {
      expect(pack.wordIds).toHaveLength(20);
      expect(new Set(pack.wordIds).size).toBe(20);
      for (const id of pack.wordIds) expect(approved.has(id)).toBe(true);
    }
  });

  it('registers every pack as a loadable book with its own review scope', () => {
    for (const pack of TOPIC_PACKS) {
      const book = findBook(`topic-${pack.id}`);
      expect(book.mode).toBe('theme');
      expect(book.count).toBe(20);
      expect(scopeFor(book)).toBe(`topic-${pack.id}`);
      expect(TOPIC_PACKS_BY_ID.get(pack.id)).toBe(pack);
    }
    const books = BOOKS.filter((book) => book.mode === 'theme');
    expect(books).toHaveLength(TOPIC_PACKS.length);
    expect(scopeFor(findBook('grade-3'))).toBe('general');
    expect(scopeFor(findBook('level-basic'))).toBe('general');
    expect(scopeFor(findBook('preschool-numbers'))).toBe('preschool-numbers');
  });

  it('loads the same words and audio ids as the approved vocabulary', async () => {
    const words = await loadBookWords(findBook('topic-animals'));
    expect(words).toHaveLength(20);
    const approved = new Map(GENERAL_WORDS.map((item) => [item.id, item]));
    for (const item of words) {
      expect(approved.get(item.id)).toBeTruthy();
      expect(item.audioId).toBe(approved.get(item.id)!.audioId);
      expect(item.category).toBe('主题包 · 动物朋友');
    }
  });
});

describe('quiz types', () => {
  it('gives every round five questions that start with the familiar picture type', () => {
    for (const scope of ['general', 'preschool-numbers', 'topic-animals']) {
      expect(quizPlan(scope)).toHaveLength(5);
      expect(quizPlan(scope)[0]).toBe('picture');
    }
    expect(new Set(quizPlan('general'))).toEqual(
      new Set(['picture', 'reverse', 'listen', 'spell']),
    );
    for (const kind of quizPlan('general')) expect(QUIZ_SECONDS[kind]).toBeGreaterThan(0);
    expect(QUIZ_SECONDS.spell).toBeGreaterThan(QUIZ_SECONDS.picture);
    expect(QUIZ_SECONDS.dialogue).toBeGreaterThan(QUIZ_SECONDS.picture);
  });

  it('spells short plain words and falls back for hyphens, digits and long words', () => {
    expect(canSpell(word('cat', '猫'))).toBe(true);
    expect(canSpell(word('apple', '苹果'))).toBe(true);
    expect(canSpell(word('ice-cream', '冰淇淋'))).toBe(false);
    expect(canSpell(word('e-mail', '电子邮件'))).toBe(false);
    expect(canSpell(word('watermelon', '西瓜'))).toBe(false);
    expect(canSpell(word('a', '一'))).toBe(false);
    expect(canSpell(word('aa', '测试'))).toBe(false);
    // A one-letter word repeated cannot be misplaced; skip it.
    expect(canSpell(word('aaa', '测试'))).toBe(false);
    expect(quizKindAt('general', 3, word('ice-cream', '冰淇淋'))).toBe('reverse');
  });

  it('builds letter tiles with the word letters plus two decoys, keys included', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const tiles = spellingTiles(word('apple', '苹果'), random);
    expect(tiles).toHaveLength(7);
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(7);
    for (const tile of tiles) expect(tile.letter).toMatch(/^[a-z]$/);
    const letters = tiles.map((tile) => tile.letter);
    for (const letter of 'apple') {
      expect(letters.filter((item) => item === letter).length).toBeGreaterThanOrEqual(
        'apple'.split('').filter((item) => item === letter).length,
      );
    }
    const decoys = letters.filter((letter) => !'apple'.includes(letter));
    expect(decoys).toHaveLength(2);
  });

  it('reads back the picked tiles in order', () => {
    const tiles = [
      { id: 'c', letter: 'c' },
      { id: 'a', letter: 'a' },
      { id: 't', letter: 't' },
    ];
    expect(spellAttempt(tiles, [0, 1, 2])).toBe('cat');
    expect(spellAttempt(tiles, [2, 1, 0])).toBe('tac');
  });

  it('keeps English options distinct and includes the answer', () => {
    const words = [
      word('hi', '嗨'),
      word('hello', '你好'),
      word('apple', '苹果'),
      word('cat', '猫'),
      word('dog', '狗'),
    ];
    for (let i = 0; i < 60; i += 1) {
      const options = optionsFor(words[2], words, 'en');
      expect(options).toHaveLength(3);
      expect(new Set(options.map((item) => item.en.toLowerCase())).size).toBe(3);
      expect(options.some((item) => item.id === 'apple')).toBe(true);
    }
  });
});

describe('dialogue questions', () => {
  const packWords = (packId: string) => new Map(topicWords(packId).map((item) => [item.id, item]));

  it('adds a dialogue slot only to topic packs', () => {
    expect(quizPlan('topic-animals')[1]).toBe('dialogue');
    expect(quizPlan('general')).not.toContain('dialogue');
    expect(quizPlan('preschool-numbers')).not.toContain('dialogue');
    expect(quizKindAt('topic-animals', 1, packWords('animals').get('cat')!)).toBe('dialogue');
    // An unreviewed word still falls back instead of showing a blank card.
    expect(quizKindAt('topic-food', 1, word('zebra', '斑马'))).toBe('reverse');
  });

  it('covers every word in every pack', () => {
    for (const pack of TOPIC_PACKS) {
      const covered = new Set(
        DIALOGUES.filter((entry) => entry.pack === pack.id).flatMap((entry) => entry.answers),
      );
      expect(
        pack.wordIds.filter((id) => !covered.has(id)),
        pack.id,
      ).toEqual([]);
    }
    for (const entry of DIALOGUES) {
      const pack = TOPIC_PACKS_BY_ID.get(entry.pack);
      expect(pack, entry.id).toBeTruthy();
      for (const id of [...entry.answers, ...entry.distractors])
        expect(pack!.wordIds, `${entry.id}/${id}`).toContain(id);
      for (const id of entry.answers)
        expect(entry.distractors, `${entry.id}/${id}`).not.toContain(id);
    }
  });

  it('keeps exactly one blank in the conversation and in the hint', () => {
    for (const entry of DIALOGUES) {
      const blanks = entry.lines
        .map((line) => (line.text.match(/___/g) ?? []).length)
        .reduce((total, count) => total + count, 0);
      expect(blanks, entry.id).toBe(1);
      expect((entry.translation.match(/___/g) ?? []).length, entry.id).toBe(1);
    }
  });

  it('builds three distinct English options containing the answer', () => {
    for (const entry of DIALOGUES) {
      const words = packWords(entry.pack);
      for (const id of entry.answers) {
        const target = words.get(id)!;
        for (let run = 0; run < 25; run += 1) {
          const options = dialogueOptions(entry, target);
          expect(options, `${entry.id}/${id}`).toHaveLength(3);
          expect(new Set(options.map((item) => item.en.toLowerCase())).size).toBe(3);
          expect(options.some((item) => item.id === id)).toBe(true);
        }
      }
    }
  });

  it('can answer every round word the topic plan asks for', () => {
    for (const pack of TOPIC_PACKS) {
      for (const [id, target] of packWords(pack.id)) {
        expect(dialogueFor(`topic-${pack.id}`, id), `${pack.id}/${id}`).toBeTruthy();
        expect(quizKindAt(`topic-${pack.id}`, 1, target)).toBe('dialogue');
      }
    }
  });
});

describe('question bank integrity', () => {
  it('gives every word a meaning, a picture and a unique Chinese sense', () => {
    const visual = (item: Word) => item.image || item.emoji || `letter:${item.en.charAt(0)}`;
    const senses = new Map<string, string>();
    for (const item of GENERAL_WORDS) {
      expect(item.zh.trim()).not.toBe('');
      expect(item.image || item.emoji).toBeTruthy();
      for (const sense of item.zh.split('；').map((part) => part.trim())) {
        expect(senses.has(sense), `${item.id} repeats 「${sense}」`).toBe(false);
        senses.set(sense, item.id);
      }
    }
    // The first grade and preschool promise one distinct picture per word.
    expect(new Set(GRADE_BANDS[1].map(visual)).size).toBe(GRADE_BANDS[1].length);
    for (const theme of PRESCHOOL_THEMES)
      expect(new Set(preschoolWords(theme.id).map(visual)).size).toBe(theme.wordIds.length);
  });

  it('loads the advertised number of words for every book', async () => {
    for (const book of BOOKS) {
      const words = await loadBookWords(book);
      expect(words.length, book.id).toBe(book.count);
      expect(book.added, book.id).toBeLessThanOrEqual(book.count);
      expect(new Set(words.map((item) => item.id)).size, book.id).toBe(words.length);
    }
  });

  it('can build three distinct, answerable options for every word in every book', async () => {
    const visual = (item: Word) => item.image || item.emoji || `letter:${item.en.charAt(0)}`;
    for (const book of BOOKS) {
      const words = await loadBookWords(book);
      for (const item of words) {
        for (const mode of ['zh', 'en'] as const) {
          const options = optionsFor(item, words, mode);
          const labels = options.map((option) =>
            mode === 'zh' ? option.zh : option.en.toLowerCase(),
          );
          expect(options, `${book.id}/${item.id}/${mode}`).toHaveLength(3);
          expect(new Set(labels).size, `${book.id}/${item.id}/${mode}`).toBe(3);
          expect(options.some((option) => option.id === item.id)).toBe(true);
          if (mode === 'zh')
            expect(new Set(options.map(visual)).size, `${book.id}/${item.id}/pictures`).toBe(3);
        }
      }
    }
  });

  it('builds usable tiles for every spellable word and falls back for the rest', () => {
    const spellable = GENERAL_WORDS.filter(canSpell);
    expect(spellable.length).toBeGreaterThan(400);
    for (const item of spellable) {
      const tiles = spellingTiles(item, () => 0.5);
      expect(tiles, item.id).toHaveLength(item.en.length + 2);
      expect(new Set(tiles.map((tile) => tile.id)).size, item.id).toBe(tiles.length);
      for (const letter of item.en.toLowerCase())
        expect(
          tiles.filter((tile) => tile.letter === letter).length,
          `${item.id}/${letter}`,
        ).toBeGreaterThanOrEqual(item.en.toLowerCase().split(letter).length - 1);
      const decoys = tiles.filter((tile) => !item.en.toLowerCase().includes(tile.letter));
      expect(decoys, item.id).toHaveLength(2);
      expect(quizKindAt('general', 3, item)).toBe('spell');
    }
    for (const item of GENERAL_WORDS.filter((entry) => !canSpell(entry)))
      expect(quizKindAt('general', 3, item)).toBe('reverse');
  });
});
