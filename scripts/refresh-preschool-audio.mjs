// Replace preschool words with Wikimedia Commons recordings when the source
// metadata and license are explicitly acceptable. Piper remains the fallback.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { execFileSync } from 'node:child_process';
import { PRESCHOOL_THEMES } from '../src/data/preschool.ts';

const allowedLicenses = new Set(['CC BY-SA 3.0', 'CC0', 'Public domain']);
const headers = {
  'User-Agent':
    'WordSprout/0.1 (educational pronunciation assets; https://wordsprout.hatim.eu.org)',
};
const preschoolIds = [...new Set(PRESCHOOL_THEMES.flatMap((theme) => theme.wordIds))];
const manifestPath = 'public/audio/sources.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const existing = new Map(manifest.map((item) => [item.word, item]));
// Optional preschool IDs allow a previously downloaded recording to be re-encoded.
const requested = process.argv.slice(2);
if (requested.some((id) => !preschoolIds.includes(id)))
  throw new Error('Only approved preschool word IDs can be refreshed.');
const candidates = requested.length
  ? [...new Set(requested)]
  : preschoolIds.filter((id) => existing.get(id)?.kind === 'synthesized');
if (!candidates.length) {
  console.log('All preschool recordings have already been refreshed.');
  process.exit(0);
}

async function download(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    if (response.ok) return new Uint8Array(await response.arrayBuffer());
    if (response.status !== 429 || attempt === 2)
      throw new Error(`Commons download: ${response.status}`);
    const retryAfter = response.headers.get('Retry-After');
    const seconds = retryAfter
      ? /^\d+$/.test(retryAfter)
        ? Number(retryAfter)
        : Math.max(1, Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000))
      : 30;
    await response.arrayBuffer();
    if (!Number.isFinite(seconds) || seconds > 60)
      throw new Error(`Commons requires a longer pause (${retryAfter}); rerun later to resume.`);
    console.log(`Commons rate limit: retrying after ${seconds}s; completed entries are saved.`);
    await delay(Math.max(1, seconds) * 1000);
  }
}

function saveManifest() {
  const staging = `${manifestPath}.tmp`;
  writeFileSync(staging, JSON.stringify([...existing.values()], null, 2) + '\n');
  renameSync(staging, manifestPath);
}

const query = new URL('https://commons.wikimedia.org/w/api.php');
query.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  prop: 'imageinfo',
  iiprop: 'url|extmetadata',
  titles: candidates.map((id) => `File:En-us-${id}.ogg`).join('|'),
});
const response = await fetch(query, { headers, signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`Commons metadata: ${response.status}`);
const metadata = await response.json();
if (metadata.error || metadata.warnings)
  throw new Error(`Commons metadata: ${JSON.stringify(metadata.error ?? metadata.warnings)}`);
const pages = Object.values(metadata.query.pages);
const plain = (value) => (value ?? '').replace(/<[^>]*>/g, '').replaceAll('&amp;', '&');

mkdirSync('.wrangler/audio-source', { recursive: true });
let replaced = 0;
for (const id of candidates) {
  const page = pages.find((item) => item.title.toLowerCase() === `file:en-us-${id}.ogg`);
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata;
  const license = meta?.LicenseShortName?.value;
  if (!info || !allowedLicenses.has(license)) {
    console.log(`${id}: keeping Piper; no approved recording at the selected source.`);
    continue;
  }
  const sourceUrl = new URL(info.url);
  if (sourceUrl.hostname !== 'upload.wikimedia.org' || sourceUrl.protocol !== 'https:')
    throw new Error(`Unexpected Commons download URL for ${id}`);
  sourceUrl.search = '';
  const sourcePath = `.wrangler/audio-source/${id}.ogg`;
  if (!existsSync(sourcePath)) {
    writeFileSync(sourcePath, await download(sourceUrl));
    await delay(2500);
  }
  // Validate a staged output before replacing the published asset.
  const output = `.wrangler/audio-source/${id}.next.mp3`;
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    sourcePath,
    '-map_metadata',
    '-1',
    '-ac',
    '1',
    '-ar',
    '44100',
    '-af',
    'loudnorm=I=-18:TP=-3:LRA=7,alimiter=limit=0.707946:level=false',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '64k',
    output,
  ]);
  const duration = Number(
    execFileSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        output,
      ],
      { encoding: 'utf8' },
    ).trim(),
  );
  if (!Number.isFinite(duration) || duration < 0.2 || duration > 10)
    throw new Error(`${id} audio duration is invalid: ${duration}`);
  const pcm = execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-i', output, '-f', 'f32le', '-ac', '1', 'pipe:1'],
    { maxBuffer: 8_000_000 },
  );
  let peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 4)
    peak = Math.max(peak, Math.abs(pcm.readFloatLE(offset)));
  if (!(peak > 0.03 && peak < 1)) throw new Error(`${id}: empty or clipped MP3 (${peak})`);
  renameSync(output, `public/audio/${id}.mp3`);
  existing.set(id, {
    word: id,
    file: `/audio/${id}.mp3`,
    source: info.descriptionurl,
    download: sourceUrl.toString(),
    author: plain(meta.Artist?.value) || '作者未标注（Commons PD-self）',
    license,
    license_url: (
      meta.LicenseUrl?.value || 'https://commons.wikimedia.org/wiki/Template:PD-self'
    ).replace('http:', 'https:'),
    changes:
      'Converted to MP3, mono 44.1 kHz / 64 kbps; loudness normalized and peak-limited. No spoken content changed.',
    duration,
  });
  saveManifest();
  replaced++;
  console.log(`${id}: ${license}, ${duration.toFixed(2)}s`);
}

console.log(`Preschool audio refresh complete: ${replaced}/${candidates.length} entries updated.`);
