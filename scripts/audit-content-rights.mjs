// Read-only provenance check. No passwords or Cloudflare credentials are read.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CURRICULUM_CORE_TARGET, GENERAL_WORD_TARGET } from '../src/data/general-words.ts';
const directory = 'docs/content-audit';
mkdirSync(directory, { recursive: true });
const manifest = JSON.parse(readFileSync('public/audio/sources.json', 'utf8'));
const recordings = manifest.filter((item) => item.kind !== 'synthesized');
const query = new URL('https://commons.wikimedia.org/w/api.php');
query.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  prop: 'imageinfo|revisions',
  iiprop: 'url|extmetadata',
  rvprop: 'ids|timestamp',
  titles: recordings
    .map((item) => decodeURIComponent(new URL(item.source).pathname.slice('/wiki/'.length)))
    .join('|'),
});
function fetchPublic(url, file) {
  execFileSync(
    'curl',
    [
      '-fsSL',
      '--retry',
      '2',
      '--retry-all-errors',
      '--connect-timeout',
      '10',
      '--max-time',
      '30',
      url,
      '-o',
      file,
    ],
    { stdio: 'inherit' },
  );
}
const raw = `${directory}/commons-source-metadata.json`;
fetchPublic(query.toString(), raw);
const pages = Object.values(JSON.parse(readFileSync(raw, 'utf8')).query.pages);
const observations = recordings.map((item) => {
  const title = decodeURIComponent(new URL(item.source).pathname.slice('/wiki/'.length));
  const page = pages.find(
    (value) => value.title.replaceAll('_', ' ') === title.replaceAll('_', ' '),
  );
  const metadata = page?.imageinfo?.[0]?.extmetadata;
  if (!metadata || metadata.LicenseShortName?.value !== item.license)
    throw new Error(`License mismatch or missing: ${item.word}`);
  return {
    word: item.word,
    source: item.source,
    license: metadata.LicenseShortName.value,
    license_url: metadata.LicenseUrl?.value ?? null,
    attribution_required: metadata.AttributionRequired?.value ?? null,
    source_revision: page.revisions?.[0]?.revid,
    source_revision_time: page.revisions?.[0]?.timestamp,
  };
});
fetchPublic(
  'https://huggingface.co/rhasspy/piper-voices/raw/main/README.md',
  `${directory}/piper-repository-readme.txt`,
);
fetchPublic(
  'https://huggingface.co/rhasspy/piper-voices/raw/main/en/en_US/ljspeech/high/MODEL_CARD',
  `${directory}/ljspeech-model-card.txt`,
);
const repo = readFileSync(`${directory}/piper-repository-readme.txt`, 'utf8');
const card = readFileSync(`${directory}/ljspeech-model-card.txt`, 'utf8');
if (!/license:\s*mit/i.test(repo) || !/License:\s*public domain/i.test(card))
  throw new Error('Model license metadata changed; requires review.');
writeFileSync(
  `${directory}/verified-sources.json`,
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      purpose:
        'Free public use with source-specific license conditions; not a guarantee of no copyright worldwide.',
      textbooks: {
        previous_collections: 8,
        approved_collections: 0,
        decision:
          'Removed: upstream repository license does not establish textbook rightsholder authorization.',
      },
      retained: {
        general_words: GENERAL_WORD_TARGET,
        curriculum_core_target: CURRICULUM_CORE_TARGET,
        curriculum_reference:
          'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf',
        human_recordings: recordings.length,
        local_synthesized_audio: manifest.length - recordings.length,
      },
      recordings: observations,
      synthetic_audio: {
        model: 'en_US-ljspeech-high',
        repository_metadata_license: 'MIT',
        model_card_dataset: 'LJ Speech: public domain',
        dataset_territory_notice:
          'The dataset publisher states public domain in the USA; do not generalize this to every jurisdiction.',
        source: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high',
        dataset_source: 'https://keithito.com/LJ-Speech-Dataset/',
      },
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Source audit complete: ${recordings.length} recording licenses matched; model/dataset metadata recorded; no textbook approved.`,
);
