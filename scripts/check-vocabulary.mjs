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
for (const shell of ['admin/index.html', 'leaderboard/index.html'])
  assert.ok(existsSync(shell), `Page route shell missing: ${shell}`);
assert.ok(!existsSync('public/_redirects'), 'Removed paths must not use a broad Pages fallback.');
if (process.argv.includes('--dist')) {
  assert.ok(existsSync('dist/404.html'));
  assert.ok(existsSync('dist/admin/index.html'));
  assert.ok(existsSync('dist/leaderboard/index.html'));
  assert.ok(!existsSync('dist/vocabulary/fltrp'));
  for (const file of readdirSync('dist/audio').filter((name) => name.endsWith('.mp3')))
    assert.ok(approved.has(file.slice(0, -4)), `unapproved built MP3: ${file}`);
}
console.log(
  `Content verified: ${CURRICULUM_CORE_TARGET}-word curriculum reference target, ${approved.size} attributed MP3s, and ${preschoolIds.size} preschool vocabulary items; no external textbook data.`,
);
