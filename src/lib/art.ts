import type { SubjectId } from '../data/question';
import type { ThemeId } from './theme';

// Stable public paths for the generated illustration set. Keeping them in one
// module means a missing file is easy to spot and the components stay dumb.
export const SUBJECT_ART: Record<SubjectId, string> = {
  english: '/art/subject-english.webp',
  chinese: '/art/subject-chinese.webp',
  math: '/art/subject-math.webp',
};

export const SUBJECT_ART_FALLBACK: Record<SubjectId, string> = {
  english: '📖',
  chinese: '🖌️',
  math: '🧮',
};

export const CELEBRATE_ART = '/art/celebrate.webp';

export const THEME_ART: Record<ThemeId, { hero: string; note: string }> = {
  boy: { hero: '/art/hero-boy.webp', note: '/art/note-boy.webp' },
  girl: { hero: '/art/hero-girl.webp', note: '/art/note-girl.webp' },
};
