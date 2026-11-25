import { ART_REV } from '../data/word-images';
import type { SubjectId } from '../data/question';
import type { ThemeId } from './theme';

// Stable public paths for the generated illustration set. Keeping them in one
// module means a missing file is easy to spot and the components stay dumb.
//
// Every URL carries the illustration revision: `/art/*` is cached for a week,
// so a fixed filename would keep showing the previous drawing from the edge and
// from returning browsers long after a repaint. `ART_REV` is regenerated from
// the files themselves by scripts/art-manifest.mjs.
const art = (path: string) => `${path}?v=${ART_REV}`;

export const SUBJECT_ART: Record<SubjectId, string> = {
  english: art('/art/subject-english.webp'),
  chinese: art('/art/subject-chinese.webp'),
  math: art('/art/subject-math.webp'),
};

export const SUBJECT_ART_FALLBACK: Record<SubjectId, string> = {
  english: '📖',
  chinese: '🖌️',
  math: '🧮',
};

export const CELEBRATE_ART = art('/art/celebrate.webp');

export const THEME_ART: Record<ThemeId, { hero: string; note: string }> = {
  boy: { hero: art('/art/hero-boy.webp'), note: art('/art/note-boy.webp') },
  girl: { hero: art('/art/hero-girl.webp'), note: art('/art/note-girl.webp') },
};
