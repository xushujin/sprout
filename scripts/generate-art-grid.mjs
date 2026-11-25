/**
 * Generate vocabulary art as 2x2 sheets, then crop each quadrant.
 *
 *   node scripts/generate-art-grid.mjs
 *   node scripts/generate-art-grid.mjs --only=face,hair --concurrency=2
 *   node scripts/generate-art-grid.mjs --force --concurrency=3
 *
 * Four words per API request keeps the cost low when the image account has a
 * small balance. Existing files are still replaced as a group so a sheet always
 * keeps one shared style.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID_GROUPS } from '../assets-src/art/grid-groups.mjs';
import { WORDS } from '../assets-src/art/prompts.mjs';
import { generateImage, readConfig } from './art-api.mjs';
import { writeWordManifest } from './art-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const only = args.find((arg) => arg.startsWith('--only='))?.split('=')[1];
const force = args.includes('--force');
const concurrency = Math.max(
  1,
  Math.min(6, Number(args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] ?? 2)),
);
const size = 384;
const rawDir = join(tmpdir(), 'sprout-art-raw');
const wordsDir = resolve(root, 'public/art/words');

const { key, apiUrl, model } = await readConfig(root);
await mkdir(rawDir, { recursive: true });

// One sheet has to hold four subjects in one style, so the medium is stated
// harder here than in STYLE: without the "not 3D / not CGI / not a photograph"
// clause the model happily returns photoreal close-ups next to painted ones.
const GRID_STYLE =
  "Flat 2D children's picture-book illustration painted in soft gouache and " +
  'coloured pencil on warm textured paper. Hand-drawn illustration only: not 3D, ' +
  'not CGI, not a photograph, no realistic skin or plastic shading. Gentle rounded ' +
  'shapes, warm natural light, soft muted colours, visible paper grain, no text, ' +
  'no letters, no numbers.';

function gridPrompt(group) {
  const [a, b, c, d] = group.map((id) => WORDS[id]);
  return (
    `${GRID_STYLE} A single square canvas divided into four equal quadrants by a wide ` +
    'transparent cross-shaped gutter. Each quadrant holds one small isolated object, ' +
    'centred, with clear empty space around it and nothing touching the gutter. All ' +
    'four objects are drawn at the same scale in the same hand-painted style on a ' +
    'transparent background. ' +
    `Top-left: ${a}. Top-right: ${b}. Bottom-left: ${c}. Bottom-right: ${d}. ` +
    'Do not add any words, letters, numbers, labels or watermarks.'
  );
}

let groups = GRID_GROUPS;
if (only) {
  const wanted = new Set(only.split(',').map((word) => word.trim()));
  groups = groups.filter((group) => group.some((id) => wanted.has(id)));
}

const pending = groups.filter(
  (group) =>
    force ||
    group.some((id) => {
      const path = resolve(wordsDir, `${id}.webp`);
      return !existsSync(path) || statSync(path).size < 2_000;
    }),
);
console.log(
  `共 ${groups.length} 组，待生成 ${pending.length} 组，并发 ${concurrency}，模型 ${model}`,
);
if (!pending.length) {
  await writeWordManifest(root);
  process.exit(0);
}

const failures = [];
let done = 0;
async function worker() {
  while (pending.length) {
    const group = pending.shift();
    const index = GRID_GROUPS.indexOf(group) + 1;
    const started = Date.now();
    try {
      const png = await generateImage({
        key,
        apiUrl,
        model,
        prompt: gridPrompt(group),
        aspect: '1:1',
      });
      const raw = join(rawDir, `grid-${index}.png`);
      await writeFile(raw, png);
      for (const [quadrant, id] of group.entries()) {
        const target = resolve(wordsDir, `${id}.webp`);
        execFileSync('python3', [
          resolve(root, 'scripts/art-grid-convert.py'),
          raw,
          target,
          String(quadrant),
          String(size),
        ]);
      }
      done += 1;
      console.log(
        `[${done}/${groups.length}] ${group.join(' + ')} · ${Math.round((Date.now() - started) / 1000)}s`,
      );
    } catch (error) {
      failures.push({ group: group.join(','), error: error.message });
      console.error(`[fail] ${group.join(',')} · ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
await writeWordManifest(root);

if (failures.length) {
  console.error(`\n${failures.length} 组失败：`);
  for (const failure of failures) console.error(`  ${failure.group}: ${failure.error}`);
  process.exitCode = 1;
}
