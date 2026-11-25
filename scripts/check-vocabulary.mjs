// Guard against restoring removed textbook content or unapproved audio assets.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import {
  CURRICULUM_CORE_TARGET,
  GENERAL_WORD_TARGET,
  GENERAL_WORDS,
  GENERAL_WORDS_BY_GRADE,
  GRADE_BANDS,
} from '../src/data/general-words.ts';
import { PRESCHOOL_THEMES, PRESCHOOL_WORDS, preschoolWords } from '../src/data/preschool.ts';
import { TOPIC_PACKS, TOPIC_PACKS_BY_ID, topicWords } from '../src/data/topics.ts';
import { DIALOGUES } from '../src/data/dialogues.ts';

const approved = new Set(GENERAL_WORDS.map((word) => word.id));
const audio = JSON.parse(readFileSync('public/audio/sources.json', 'utf8'));
assert.equal(CURRICULUM_CORE_TARGET, 505);
assert.equal(GENERAL_WORD_TARGET, 600);
assert.equal(GENERAL_WORDS.length, GENERAL_WORD_TARGET);
assert.equal(approved.size, GENERAL_WORD_TARGET);
assert.equal(audio.length, approved.size);
assert.equal(new Set(audio.map((item) => item.word)).size, approved.size);
let cumulativeCount = 0;
for (const [grade, words] of Object.entries(GRADE_BANDS)) {
  cumulativeCount += words.length;
  assert.equal(
    GENERAL_WORDS_BY_GRADE[grade].length,
    cumulativeCount,
    `grade ${grade} cumulative count`,
  );
  for (const word of words) {
    assert.match(word.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(word.en.trim() && word.zh.trim());
    const source = audio.find((item) => item.word === word.id);
    assert.ok(source, `missing audio attribution: ${word.id}`);
    assert.equal(source.file, `/audio/${word.id}.mp3`, `audio file mismatch: ${word.id}`);
    assert.ok(word.emoji || word.image, `missing picture: ${word.id}`);
    if (source.kind === 'synthesized') {
      assert.equal(source.model, 'en_US-ljspeech-high');
      assert.ok(source.dataset_url?.startsWith('https://keithito.com/'));
    } else {
      assert.ok(
        ['CC BY-SA 3.0', 'CC0', 'Public domain'].includes(source.license),
        `unapproved audio: ${word.id}`,
      );
      assert.ok(source.source?.startsWith('https://commons.wikimedia.org/'));
      assert.ok(source.author && source.license_url);
    }
    const bytes = readFileSync(`public/audio/${word.id}.mp3`);
    assert.ok(
      bytes.length >= 1000 && (bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 0xff),
      `invalid MP3 ${word.id}`,
    );
  }
}
assert.equal(cumulativeCount, GENERAL_WORD_TARGET);
const visual = (word) => word.image || word.emoji || `letter:${word.en.charAt(0)}`;
const seenEn = new Set();
const seenZh = new Set();
const seenSenses = new Map();
for (const word of GENERAL_WORDS) {
  assert.match(word.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(word.en.trim() && word.zh.trim());
  assert.ok(word.emoji || word.image, `missing picture: ${word.id}`);
  assert.ok(!word.zh.includes('|'), `malformed meaning: ${word.id}`);
  assert.ok(!seenEn.has(word.en.toLowerCase()), `duplicate spelling: ${word.en}`);
  assert.ok(!seenZh.has(word.zh), `duplicate meaning: ${word.zh}`);
  seenEn.add(word.en.toLowerCase());
  seenZh.add(word.zh);
  // One Chinese sense must point at exactly one English word, otherwise a
  // "看中文选英文" question can have two defensible answers.
  for (const sense of word.zh.split('；').map((item) => item.trim())) {
    assert.ok(sense, `empty sense: ${word.id}`);
    assert.ok(
      !seenSenses.has(sense),
      `shared sense 「${sense}」: ${seenSenses.get(sense)} and ${word.id}`,
    );
    seenSenses.set(sense, word.id);
  }
}
// The first grade and every preschool theme promise one distinct picture per
// word; higher grades may reuse an emoji, but options exclude shared pictures.
assert.equal(
  new Set(GRADE_BANDS[1].map(visual)).size,
  GRADE_BANDS[1].length,
  'grade 1 pictures must be unique',
);
for (const theme of PRESCHOOL_THEMES)
  assert.equal(
    new Set(preschoolWords(theme.id).map(visual)).size,
    theme.wordIds.length,
    `preschool pictures must be unique: ${theme.id}`,
  );
const preschoolIds = new Set();
for (const theme of PRESCHOOL_THEMES) {
  assert.match(theme.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(theme.wordIds.length, 10, `preschool ${theme.id} must offer at least two rounds`);
  assert.equal(new Set(theme.wordIds).size, theme.wordIds.length, `duplicate in ${theme.id}`);
  assert.equal(preschoolWords(theme.id).length, 10);
  for (const id of theme.wordIds) {
    assert.ok(approved.has(id), `preschool source must remain in approved vocabulary: ${id}`);
    // Different preschool scenes can revisit a familiar word in a new context.
    preschoolIds.add(id);
  }
}
assert.equal(PRESCHOOL_WORDS.length, 50);
assert.equal(preschoolIds.size, 50);
let topicItems = 0;
for (const pack of TOPIC_PACKS) {
  assert.match(pack.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(pack.wordIds.length, 20, `topic ${pack.id} must offer four rounds`);
  assert.equal(new Set(pack.wordIds).size, pack.wordIds.length, `duplicate in ${pack.id}`);
  assert.equal(topicWords(pack.id).length, 20);
  for (const id of pack.wordIds) {
    assert.ok(approved.has(id), `topic source must remain in approved vocabulary: ${id}`);
  }
  topicItems += pack.wordIds.length;
}
assert.equal(topicItems, TOPIC_PACKS.length * 20);
// Dialogue questions are authored by hand, so the guard checks the mechanics
// (one blank, in-pack answers, article agreement) that a review can miss.
// Context words may sit outside the 600-word list; they are read, never tested.
// Glue is limited to what a beginner can read without being taught: function
// words, pronouns, very common verbs, and inflected forms of approved words.
// Content words that carry a question's answer never belong here.
const DIALOGUE_GLUE = new Set(
  `a an the this that these those it its it's what what's let's that's i'm don't can't
  i you he she we they me him her us them my your his our their
  is am are was were be been do does did have has had can will would
  and or but so because if not no yes ok
  in on at by for with from of to into under over up down out off near around
  here there where when who why how which
  some any many much more most all both each every little lot
  very too also just only still then now again after before first next last away inside together
  one two three four five six seven eight nine ten
  look see hear smell wash wait want need help make take give find keep borrow play go goes come get put turn start stop
  say says like likes look looks feel feels smell smells make makes grow grows cook cooks
  drive drives fly flies run runs fall falls take takes turn turns stay stays work works play plays
  rain rains snow snows hurt hurts help helps climb give live lives wag wags
  thank thanks hello hi please sorry ok wow meow woof oink
  tail ears carrots bananas apples arms eyes legs fingers teeth wings
  books words rooms cars wheels minutes years lessons flowers leaves
  box page class colour food fun garden playground plate rails rest sea seat sky song spoon name sure time
  cloud honey flag flying own
  top voice water milk day
  black white green yellow brown pink purple red blue big small long short tall high heavy
  soft hard fast slow round straight busy dark sweet juicy favourite nice cute strong
  good bad new old warm cool hot cold hungry quiet safe beautiful`
    .split(/\s+/)
    .filter(Boolean),
);
const WORD_EN = new Map(GENERAL_WORDS.map((word) => [word.id, word.en]));
const dialogueIds = new Set();
const dialogueTexts = new Set();
const coveredByPack = new Map();
for (const entry of DIALOGUES) {
  assert.match(entry.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!dialogueIds.has(entry.id), `duplicate dialogue id: ${entry.id}`);
  dialogueIds.add(entry.id);
  const pack = TOPIC_PACKS_BY_ID.get(entry.pack);
  assert.ok(pack, `unknown topic pack: ${entry.pack}`);
  const packIds = new Set(pack.wordIds);
  assert.ok(entry.lines.length >= 2 && entry.lines.length <= 3, `dialogue length: ${entry.id}`);
  let blanks = 0;
  for (const line of entry.lines) {
    assert.ok(line.speaker === 'A' || line.speaker === 'B', `speaker: ${entry.id}`);
    assert.ok(line.text.trim(), `empty line: ${entry.id}`);
    assert.ok(line.text.length <= 60, `line too long: ${entry.id}`);
    blanks += (line.text.match(/___/g) ?? []).length;
    for (const token of line.text.toLowerCase().match(/[a-z']+/g) ?? []) {
      assert.ok(
        approved.has(token) || DIALOGUE_GLUE.has(token),
        `dialogue uses unlisted word 「${token}」 in ${entry.id}`,
      );
    }
  }
  assert.equal(blanks, 1, `exactly one blank: ${entry.id}`);
  assert.equal((entry.translation.match(/___/g) ?? []).length, 1, `translation blank: ${entry.id}`);
  assert.ok(entry.answers.length, `no answer: ${entry.id}`);
  assert.equal(new Set(entry.answers).size, entry.answers.length, `duplicate answer: ${entry.id}`);
  assert.ok(entry.distractors.length >= 2, `need two distractors: ${entry.id}`);
  assert.equal(
    new Set(entry.distractors).size,
    entry.distractors.length,
    `duplicate distractor: ${entry.id}`,
  );
  for (const id of [...entry.answers, ...entry.distractors]) {
    assert.ok(approved.has(id), `dialogue word not approved: ${entry.id} -> ${id}`);
    assert.ok(packIds.has(id), `dialogue word outside pack: ${entry.id} -> ${id}`);
  }
  for (const id of entry.answers)
    assert.ok(!entry.distractors.includes(id), `answer reused as distractor: ${entry.id} -> ${id}`);
  const text = entry.lines.map((line) => line.text).join(' ');
  const article = text.match(/\b(a|an)\s+___/i);
  if (article)
    for (const id of entry.answers)
      assert.equal(
        article[1].toLowerCase() === 'an',
        /^[aeiou]/i.test(WORD_EN.get(id)),
        `article a/an mismatch: ${entry.id} -> ${id}`,
      );
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  assert.ok(!dialogueTexts.has(normalized), `duplicate dialogue text: ${entry.id}`);
  dialogueTexts.add(normalized);
  const covered = coveredByPack.get(entry.pack) ?? new Set();
  for (const id of entry.answers) covered.add(id);
  coveredByPack.set(entry.pack, covered);
}
for (const [packId, covered] of coveredByPack) {
  const pack = TOPIC_PACKS_BY_ID.get(packId);
  assert.ok(
    covered.size >= Math.ceil(pack.wordIds.length * 0.8),
    `dialogue coverage below 80%: ${packId} (${covered.size}/${pack.wordIds.length})`,
  );
}
for (const file of readdirSync('public/audio').filter((name) => name.endsWith('.mp3'))) {
  assert.ok(approved.has(file.slice(0, -4)), `unapproved MP3: ${file}`);
}
const allowedVocabularyFiles = new Set(['credits.html']);
for (const file of readdirSync('public/vocabulary'))
  assert.ok(allowedVocabularyFiles.has(file), `unapproved public word list: ${file}`);
for (const path of [
  'src/data/fltrp-index.ts',
  'scripts/import-vocabulary.mjs',
  'public/vocabulary/fltrp',
])
  assert.ok(!existsSync(path), `retired source restored: ${path}`);
assert.ok(existsSync('public/404.html'), 'Removed assets must be real 404 responses on Pages.');
for (const shell of ['admin/index.html', 'leaderboard/index.html', 'profile/index.html'])
  assert.ok(existsSync(shell), `Page route shell missing: ${shell}`);
assert.ok(!existsSync('public/_redirects'), 'Removed paths must not use a broad Pages fallback.');
if (process.argv.includes('--dist')) {
  assert.ok(existsSync('dist/404.html'));
  assert.ok(existsSync('dist/admin/index.html'));
  assert.ok(existsSync('dist/leaderboard/index.html'));
  assert.ok(existsSync('dist/profile/index.html'));
  assert.ok(!existsSync('dist/vocabulary/fltrp'));
  for (const file of readdirSync('dist/audio').filter((name) => name.endsWith('.mp3')))
    assert.ok(approved.has(file.slice(0, -4)), `unapproved built MP3: ${file}`);
}
console.log(
  `Content verified: ${CURRICULUM_CORE_TARGET}-word curriculum reference target, ${approved.size} attributed MP3s, ${preschoolIds.size} preschool vocabulary items, ${topicItems} topic-pack entries, and ${DIALOGUES.length} reviewed dialogues; no external textbook data.`,
);
