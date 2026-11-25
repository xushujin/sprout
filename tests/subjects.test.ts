import { describe, expect, it } from 'vitest';
import { CHINESE_QUESTIONS, chineseQuestions } from '../src/data/chinese';
import { SUBJECT_BOOKS, findSubjectBook, seededRandom, subjectBooks } from '../src/data/question';
import { MATH_TOPIC_COUNT, makeMathQuestion, mathTopics } from '../src/lib/math-quiz';
import { emptyProgress, makeSubjectRound } from '../src/lib/progress';

describe('subject books', () => {
  it('offers six graded books for each new subject', () => {
    expect(SUBJECT_BOOKS).toHaveLength(12);
    for (const subject of ['chinese', 'math'] as const) {
      expect(subjectBooks(subject).map((book) => book.grade)).toEqual([1, 2, 3, 4, 5, 6]);
    }
    expect(findSubjectBook('chinese-g2', 'chinese').grade).toBe(2);
    // A grade saved under one subject must not leak into the other tab.
    expect(findSubjectBook('chinese-g2', 'math').id).toBe('math-g1');
    expect(findSubjectBook(undefined, 'math').id).toBe('math-g1');
  });
});

describe('Chinese bank', () => {
  it('holds 900+ authored questions with a real mix per grade', () => {
    expect(CHINESE_QUESTIONS.length).toBeGreaterThanOrEqual(900);
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      const pool = chineseQuestions(grade);
      expect(pool.length).toBeGreaterThanOrEqual(140);
      expect(new Set(pool.map((item) => item.topic)).size).toBeGreaterThanOrEqual(6);
      expect(new Set(pool.map((item) => item.key)).size).toBe(pool.length);
    }
  });

  it('always writes three distinct choices with the answer among them', () => {
    for (const question of CHINESE_QUESTIONS) {
      expect(question.choices, question.key).toHaveLength(3);
      expect(new Set(question.choices).size, question.key).toBe(3);
      expect(question.choices, question.key).toContain(question.answer);
      expect(question.prompt.trim(), question.key).not.toBe('');
      expect(question.explain.trim(), question.key).not.toBe('');
    }
  });

  it('keeps one reading per grade so a round cannot ask "mù" twice', () => {
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      const readings = chineseQuestions(grade)
        .filter((item) => item.topic === '拼音认字')
        .map((item) => item.prompt);
      expect(new Set(readings).size, `grade ${grade}`).toBe(readings.length);
    }
  });
});

describe('maths generator', () => {
  it('covers at least fourteen topics in every grade', () => {
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      expect(mathTopics(grade)).toHaveLength(MATH_TOPIC_COUNT[grade]);
      expect(MATH_TOPIC_COUNT[grade]).toBeGreaterThanOrEqual(14);
    }
  });

  it('never produces a duplicate or missing option across many draws', () => {
    const distinct = new Set<string>();
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      for (const topic of mathTopics(grade)) {
        for (let i = 0; i < 120; i += 1) {
          const question = makeMathQuestion(topic, Math.random);
          expect(question.choices, topic.id).toHaveLength(3);
          expect(new Set(question.choices).size, topic.id).toBe(3);
          expect(question.choices, topic.id).toContain(question.answer);
          expect(question.explain).not.toMatch(/NaN|undefined|Infinity/);
          distinct.add(question.prompt);
        }
      }
    }
    // 104 topics × 120 draws: the point is variety, not a fixed count.
    expect(distinct.size).toBeGreaterThan(1500);
  });
});

describe('subject rounds', () => {
  it('builds five distinct questions for every book', () => {
    for (const book of SUBJECT_BOOKS) {
      const round = makeSubjectRound(emptyProgress(), book, seededRandom(book.id));
      expect(round, book.id).toHaveLength(5);
      expect(new Set(round.map((item) => item.question.key)).size, book.id).toBe(5);
      for (const item of round) {
        expect(item.question.choices).toContain(item.question.answer);
      }
    }
  });

  it('puts a missed question first and marks it for the bonus', () => {
    const book = findSubjectBook('chinese-g2');
    const missed = chineseQuestions(2)[7];
    const progress = emptyProgress();
    progress.subjects = {
      [book.id]: {
        [missed.key]: { seen: 2, correct: 0, needsReview: true, lastSeen: 1 },
      },
    };
    const round = makeSubjectRound(progress, book, seededRandom('review'));
    expect(round[0].question.key).toBe(missed.key);
    expect(round[0].wasMistake).toBe(true);
    expect(round[0].isNew).toBe(false);
  });

  it('keeps a stable topic key while regenerating maths numbers', () => {
    const book = findSubjectBook('math-g3');
    const promptsByTopic = new Map<string, Set<string>>();
    for (let i = 0; i < 20; i += 1) {
      const round = makeSubjectRound(emptyProgress(), book, seededRandom(`round-${i}`));
      for (const item of round) {
        expect(item.question.key).toMatch(/^math:g3:/);
        expect(item.question.grade).toBe(3);
        const prompts = promptsByTopic.get(item.question.key) ?? new Set<string>();
        prompts.add(item.question.prompt);
        promptsByTopic.set(item.question.key, prompts);
      }
    }
    // A revisited topic must ask a new question, not repeat the same numbers.
    expect([...promptsByTopic.values()].some((prompts) => prompts.size > 1)).toBe(true);
  });
});

// Grade placement is part of the product promise: a parent opening "三年级"
// must not get 一上 characters or 六年级 maths. These guards fail loudly if a
// future edit drops a topic into the wrong year.
describe('curriculum placement', () => {
  it('keeps literacy questions in the lower grades only', () => {
    for (const grade of [1, 2, 3] as const) {
      const topics = new Set(chineseQuestions(grade).map((item) => item.topic));
      expect(topics.has('拼音认字'), `grade ${grade}`).toBe(true);
      expect(topics.has('看字选音'), `grade ${grade}`).toBe(true);
    }
    for (const grade of [4, 5, 6] as const) {
      const topics = new Set(chineseQuestions(grade).map((item) => item.topic));
      expect(topics.has('拼音认字'), `grade ${grade}`).toBe(false);
      expect(topics.has('看字选音'), `grade ${grade}`).toBe(false);
      expect(topics.has('偏旁部首'), `grade ${grade}`).toBe(false);
    }
  });

  it('starts idioms in grade two and the advanced types in grade four', () => {
    expect(chineseQuestions(1).some((item) => item.topic === '成语填空')).toBe(false);
    expect(chineseQuestions(2).some((item) => item.topic === '成语填空')).toBe(true);
    for (const grade of [1, 2, 3] as const) {
      const topics = new Set(chineseQuestions(grade).map((item) => item.topic));
      for (const advanced of ['多音字', '修辞手法', '关联词', '文学常识', '字词理解']) {
        expect(topics.has(advanced), `grade ${grade} ${advanced}`).toBe(false);
      }
    }
    for (const grade of [4, 5, 6] as const) {
      const topics = new Set(chineseQuestions(grade).map((item) => item.topic));
      for (const advanced of ['多音字', '修辞手法', '关联词', '文学常识', '字词理解']) {
        expect(topics.has(advanced), `grade ${grade} ${advanced}`).toBe(true);
      }
    }
  });

  it('does not teach a maths idea before its textbook year', () => {
    const banned: Record<number, RegExp> = {
      1: /^(mult|div|frac|dec|circle|percent|ratio|cuboid|cyl|cone|tri|para|trap)/,
      2: /^(frac|dec|circle|percent|ratio|cuboid|cyl|cone|negative|scale)/,
      3: /^(circle|percent|ratio|cuboid|cyl|cone|negative|scale)/,
      4: /^(circle|percent|ratio|cyl|cone|negative|scale)/,
      5: /^(circle|percent|cyl|cone|negative|scale)/,
      6: /^$/,
    };
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      for (const topic of mathTopics(grade)) {
        expect(banned[grade].test(topic.id), `grade ${grade} ${topic.id}`).toBe(false);
      }
    }
    expect(mathTopics(1).some((topic) => topic.id.startsWith('div'))).toBe(false);
    expect(mathTopics(2).some((topic) => topic.id === 'divrem')).toBe(true);
    expect(mathTopics(2).some((topic) => topic.id === 'clockread')).toBe(true);
    expect(mathTopics(3).some((topic) => topic.id === 'timesec')).toBe(true);
    expect(mathTopics(4).some((topic) => topic.id === 'anglecalc')).toBe(true);
    expect(mathTopics(5).some((topic) => topic.id === 'tree')).toBe(true);
    expect(mathTopics(4).some((topic) => topic.id === 'tree')).toBe(false);
  });
});
