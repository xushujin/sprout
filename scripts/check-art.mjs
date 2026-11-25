// Guards the illustration contract: every referenced file exists, every file
// belongs to a real word, and the first two grades stay fully illustrated.
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE_BANDS } from '../src/data/curriculum-words.ts';
import { ART_REV, WORD_ART_IDS } from '../src/data/word-images.ts';
import { artRevision } from './art-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const sceneFiles = [
  'hero-boy.webp',
  'hero-girl.webp',
  'subject-english.webp',
  'subject-chinese.webp',
  'subject-math.webp',
  'note-boy.webp',
  'note-girl.webp',
  'celebrate.webp',
];

function checkFile(relative) {
  const path = resolve(root, 'public', relative);
  if (!existsSync(path)) {
    problems.push(`缺少插画：public/${relative}`);
    return;
  }
  if (statSync(path).size < 2_000) problems.push(`插画文件过小：public/${relative}`);
}

for (const file of sceneFiles) checkFile(`art/${file}`);

const known = new Set(
  Object.values(GRADE_BANDS)
    .flat()
    .map((word) => word.id),
);
for (const id of WORD_ART_IDS) {
  if (!known.has(id)) problems.push(`词画清单含未知单词：${id}`);
  checkFile(`art/words/${id}.webp`);
}

const illustrated = new Set(WORD_ART_IDS);
for (const id of WORD_ART_IDS) {
  if (id !== id.toLowerCase()) problems.push(`词画文件名必须小写：${id}`);
}
const coverage = {};
for (const grade of [1, 2]) {
  const missing = GRADE_BANDS[grade].filter((word) => !illustrated.has(word.id));
  coverage[grade] = { total: GRADE_BANDS[grade].length, missing };
}
if (coverage[1].missing.length) {
  problems.push(
    `一年级插画不完整：${coverage[1].total - coverage[1].missing.length}/${coverage[1].total}，` +
      `缺 ${coverage[1].missing.map((word) => word.id).join(', ')}`,
  );
}

if (problems.length) {
  console.error('插画检查未通过：');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

// A stale revision means a repainted file keeps its old URL, so returning
// visitors and the edge cache keep showing the previous drawing for a week.
const actualRev = artRevision(root);
if (actualRev !== ART_REV) {
  console.error(
    `插画版本号过期：src/data/word-images.ts 是 ${ART_REV}，实际文件是 ${actualRev}。` +
      '请运行 `npm run art:manifest` 更新。',
  );
  process.exit(1);
}

const gradeOne = coverage[1].total - coverage[1].missing.length;
const gradeTwo = coverage[2].total - coverage[2].missing.length;
console.log(
  `插画检查通过：${sceneFiles.length} 张场景图，${WORD_ART_IDS.length} 张单词图；` +
    `一年级 ${gradeOne}/${coverage[1].total}，二年级 ${gradeTwo}/${coverage[2].total}。`,
);
if (coverage[1].missing.length) {
  console.warn(`  一年级待补：${coverage[1].missing.map((word) => word.id).join(', ')}`);
}
if (coverage[2].missing.length) {
  console.warn(`  二年级待补 ${coverage[2].missing.length} 个，暂用 emoji 兜底。`);
}
