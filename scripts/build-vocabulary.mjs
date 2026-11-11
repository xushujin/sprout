// Only project-authored general exercises are eligible for publication.
// External textbook import has been removed because its rights were unverified.
import { mkdirSync, writeFileSync } from 'node:fs';
import { GENERAL_WORDS } from '../src/data/general-words.ts';

mkdirSync('.wrangler', { recursive: true });
writeFileSync(
  '.wrangler/vocabulary-audio-input.json',
  JSON.stringify(
    GENERAL_WORDS.map(({ id, en }) => ({ id, en })),
    null,
    2,
  ) + '\n',
);
console.log(`General vocabulary only: ${GENERAL_WORDS.length} independently assembled entries.`);
