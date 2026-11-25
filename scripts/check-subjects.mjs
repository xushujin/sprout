import assert from 'node:assert/strict';
import { CHINESE_QUESTIONS, CHINESE_TOTAL, chineseQuestions } from '../src/data/chinese.ts';
import { SUBJECT_BOOKS, findSubjectBook, subjectBooks } from '../src/data/question.ts';
import { MATH_TOPIC_COUNT, makeMathQuestion, mathTopics } from '../src/lib/math-quiz.ts';
import { makeSubjectRound } from '../src/lib/progress.ts';

const problems = [];
const fail = (message) => problems.push(message);

function checkQuestion(question, label) {
  if (question.choices.length !== 3) fail(`${label}: expected 3 choices`);
  if (new Set(question.choices).size !== 3) fail(`${label}: duplicate choices`);
  if (!question.choices.includes(question.answer)) fail(`${label}: answer missing from choices`);
  if (!question.prompt.trim()) fail(`${label}: empty prompt`);
  if (!question.explain.trim()) fail(`${label}: empty explain`);
  if (question.grade < 1 || question.grade > 6) fail(`${label}: bad grade`);
}

// Subject books ---------------------------------------------------------------
assert.equal(SUBJECT_BOOKS.length, 12, 'twelve subject books (6 Chinese + 6 maths)');
for (const subject of ['chinese', 'math']) {
  assert.equal(subjectBooks(subject).length, 6, `${subject} has six grades`);
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const book = findSubjectBook(undefined, subject);
    assert.ok(book, `${subject} default book`);
    assert.equal(
      subjectBooks(subject).some((item) => item.grade === grade),
      true,
    );
  }
}
assert.equal(
  findSubjectBook('chinese-g2', 'math').id,
  'math-g1',
  'grade cannot leak across subjects',
);

// Chinese bank ---------------------------------------------------------------
assert.ok(CHINESE_TOTAL >= 900, `Chinese bank should hold 900+ questions, has ${CHINESE_TOTAL}`);
const keys = new Set();
const prompts = new Set();
const topicsByGrade = new Map();
for (const [index, question] of CHINESE_QUESTIONS.entries()) {
  const label = `zh#${index}:${question.key}`;
  checkQuestion(question, label);
  if (keys.has(question.key)) fail(`${label}: duplicate key`);
  keys.add(question.key);
  if (prompts.has(`${question.prompt}|${question.answer}`))
    fail(`${label}: duplicate prompt + answer`);
  prompts.add(`${question.prompt}|${question.answer}`);
  if (question.subject !== 'chinese') fail(`${label}: wrong subject`);
  if (!question.topic) fail(`${label}: missing topic`);
  const set = topicsByGrade.get(question.grade) ?? new Set();
  set.add(question.topic);
  topicsByGrade.set(question.grade, set);
}
for (const grade of [1, 2, 3, 4, 5, 6]) {
  const pool = chineseQuestions(grade);
  if (pool.length < 140) fail(`Chinese grade ${grade}: only ${pool.length} questions`);
  if ((topicsByGrade.get(grade)?.size ?? 0) < 6) fail(`Chinese grade ${grade}: too few topics`);
  // Each grade must have a balanced mix, not 95% one drill.
  const byTopic = new Map();
  for (const question of pool) byTopic.set(question.topic, (byTopic.get(question.topic) ?? 0) + 1);
  if (Math.max(...byTopic.values()) > pool.length * 0.55)
    fail(`Chinese grade ${grade}: one topic dominates`);
}

// Pinyin questions have to be readable and toned, or a child cannot sound them out.
const PINYIN = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/;
for (const question of CHINESE_QUESTIONS.filter((item) => item.topic === '拼音认字')) {
  if (!PINYIN.test(question.prompt)) fail(`pinyin prompt: ${question.prompt}`);
  if ([...question.answer].length !== 1) fail(`char answer not a single char: ${question.answer}`);
  if (question.choices.some((choice) => [...choice].length !== 1))
    fail(`char choices must be single characters: ${question.choices.join('/')}`);
}
for (const question of CHINESE_QUESTIONS.filter((item) => item.topic === '看字选音')) {
  if ([...question.prompt].length !== 1) fail(`char prompt not a single char: ${question.prompt}`);
  if (!PINYIN.test(question.answer)) fail(`char answer not pinyin: ${question.answer}`);
}
// Homophones may appear in different grades, but never twice in one grade pool.
for (const grade of [1, 2, 3, 4, 5, 6]) {
  const readings = chineseQuestions(grade)
    .filter((item) => item.topic === '拼音认字')
    .map((item) => item.prompt);
  if (new Set(readings).size !== readings.length)
    fail(`Chinese grade ${grade}: the same reading appears twice`);
}

// Maths bank ----------------------------------------------------------------
let generated = 0;
let distinct = 0;
for (const grade of [1, 2, 3, 4, 5, 6]) {
  const topics = mathTopics(grade);
  if (topics.length !== MATH_TOPIC_COUNT[grade]) fail(`math grade ${grade}: topic count mismatch`);
  if (topics.length < 14) fail(`math grade ${grade}: only ${topics.length} topics`);
  const seen = new Set();
  for (const topic of topics) {
    for (let i = 0; i < 250; i += 1) {
      const question = makeMathQuestion(topic, Math.random);
      generated += 1;
      seen.add(question.prompt);
      checkQuestion(question, `math:${topic.id}`);
      if (question.subject !== 'math') fail(`math:${topic.id}: wrong subject`);
      if (question.topic !== topic.name) fail(`math:${topic.id}: topic drift`);
      if (
        /NaN|undefined|Infinity/.test(
          question.prompt + question.choices.join('') + question.explain,
        )
      )
        fail(`math:${topic.id}: invalid number in output`);
    }
  }
  distinct += seen.size;
  if (seen.size < 500)
    fail(`math grade ${grade}: only ${seen.size} distinct prompts in 250 draws/topic`);
}

// A dry round-build must work for every grade without a stored history.
for (const book of SUBJECT_BOOKS) {
  const round = makeSubjectRound({ ...emptyProgressForCheck(), version: 1 }, book, Math.random);
  if (round.length !== 5) fail(`${book.id}: round has ${round.length} questions`);
  if (new Set(round.map((item) => item.question.key)).size !== 5)
    fail(`${book.id}: duplicate question key in one round`);
  for (const item of round) checkQuestion(item.question, `${book.id}:${item.question.key}`);
}

function emptyProgressForCheck() {
  return {
    words: {},
    pending: [],
    rounds: 0,
    points: 0,
    correct: 0,
    answered: 0,
    recentRoundIds: [],
  };
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
const perGrade = [1, 2, 3, 4, 5, 6].map((grade) => chineseQuestions(grade).length).join(' / ');
console.log(
  `Chinese ${CHINESE_TOTAL} questions (grade 1-6: ${perGrade}), ` +
    `maths ${Object.values(MATH_TOPIC_COUNT).reduce((sum, count) => sum + count, 0)} topics, ` +
    `${generated} generated samples (${distinct} distinct prompts) all valid.`,
);
