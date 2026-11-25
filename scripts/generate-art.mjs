/**
 * Generate the hand-painted illustration set.
 *
 *   node scripts/generate-art.mjs                       # everything missing
 *   node scripts/generate-art.mjs --only=scenes         # hero + subject art
 *   node scripts/generate-art.mjs --only=word:apple,cat # a few words
 *   node scripts/generate-art.mjs --force --concurrency=6
 *
 * Credentials come from `IMAGE_API_KEY` or the git-ignored `.env.art`; the
 * endpoint and model can be overridden there too (see scripts/art-api.mjs).
 * Successful word images are written to public/art/words and reflected in
 * src/data/word-images.ts, which the quiz uses to decide between an
 * illustration and the emoji fallback.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES, STYLE, WORDS } from '../assets-src/art/prompts.mjs';
import { generateImage, readConfig } from './art-api.mjs';
import { writeWordManifest } from './art-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const concurrency = Math.max(
  1,
  Math.min(10, Number(args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] ?? 4)),
);
const only = args.find((arg) => arg.startsWith('--only='))?.split('=')[1];

const { key, apiUrl, model } = await readConfig(root);

const rawDir = join(tmpdir(), 'sprout-art-raw');
await mkdir(rawDir, { recursive: true });

/** Fallback canvas for a scene that does not declare one, keyed by aspect ratio. */
const CANVAS = { '2:3': [720, 1080], '1:1': [512, 512], '3:2': [768, 512] };

async function convert(pngPath, webpPath, width, height) {
  execFileSync('python3', [
    resolve(root, 'scripts/art-convert.py'),
    pngPath,
    webpPath,
    String(width),
    String(height),
  ]);
}

const sceneJobs = Object.entries(SCENES).map(([id, scene]) => ({
  kind: 'scene',
  id,
  description: scene.prompt,
  style: scene.style ?? STYLE,
  aspect: scene.aspect ?? '1:1',
  output: resolve(root, `public/art/${id}.webp`),
  canvas: scene.canvas ?? CANVAS[scene.aspect ?? '1:1'] ?? CANVAS['1:1'],
}));

const wordJobs = Object.entries(WORDS).map(([id, description]) => ({
  kind: 'word',
  id,
  description,
  style: STYLE,
  aspect: '1:1',
  output: resolve(root, `public/art/words/${id}.webp`),
  canvas: [384, 384],
}));

let jobs = [...sceneJobs, ...wordJobs];
if (only === 'scenes') jobs = sceneJobs;
else if (only === 'words') jobs = wordJobs;
else if (only?.startsWith('scene:')) {
  const wanted = new Set(
    only
      .slice(6)
      .split(',')
      .map((id) => id.trim()),
  );
  jobs = sceneJobs.filter((job) => wanted.has(job.id));
} else if (only?.startsWith('word:')) {
  const wanted = new Set(
    only
      .slice(5)
      .split(',')
      .map((id) => id.trim()),
  );
  jobs = wordJobs.filter((job) => wanted.has(job.id));
} else if (only) {
  throw new Error(`未知的 --only 值：${only}`);
}

const pending = jobs.filter(
  (job) => force || !existsSync(job.output) || statSync(job.output).size < 2_000,
);
console.log(
  `共 ${jobs.length} 张，待生成 ${pending.length} 张，并发 ${concurrency}，模型 ${model}`,
);
if (!pending.length) {
  await writeWordManifest(root);
  process.exit(0);
}

const failures = [];
let done = 0;
async function worker() {
  while (pending.length) {
    const job = pending.shift();
    const started = Date.now();
    try {
      const png = await generateImage({
        key,
        apiUrl,
        model,
        prompt: `${job.style} Subject: ${job.description}.`,
        aspect: job.aspect,
      });
      const raw = resolve(rawDir, `${job.kind}-${job.id}.png`);
      await writeFile(raw, png);
      await convert(raw, job.output, job.canvas[0], job.canvas[1]);
      done += 1;
      console.log(
        `[${done}/${jobs.length}] ${job.kind} ${job.id} · ${Math.round((Date.now() - started) / 1000)}s`,
      );
    } catch (error) {
      failures.push({ id: job.id, error: error.message });
      console.error(`[fail] ${job.kind} ${job.id} · ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
await writeWordManifest(root);

if (failures.length) {
  console.error(`\n${failures.length} 张失败：`);
  for (const failure of failures) console.error(`  ${failure.id}: ${failure.error}`);
  process.exitCode = 1;
}
