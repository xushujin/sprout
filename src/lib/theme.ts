import type { User } from '../../shared/types';

// The visual skin follows the avatar the child already picked, so there is no
// second "theme" setting to maintain. A user without a gender (for example a
// teacher account that never opened the avatar editor) keeps the default
// forest palette.
export type ThemeId = 'boy' | 'girl';

export function themeFor(user?: User | null): ThemeId | null {
  const gender = user?.avatar?.gender;
  return gender === 'girl' || gender === 'boy' ? gender : null;
}

export function applyTheme(theme: ThemeId | null) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
}

export const THEME_COPY: Record<ThemeId, { badge: string; hint: string; note: string }> = {
  boy: {
    badge: '🌲 森林探险队',
    hint: '带上好奇心，去森林里发现新朋友。',
    note: '像小树一样，每天向上长一点。',
  },
  girl: {
    badge: '🌸 花园小队',
    hint: '把每一个新朋友，种进你的小花园。',
    note: '像小花一样，慢慢开出自己的颜色。',
  },
};

/** Copy for the greeting; falls back to the forest wording before a gender is picked. */
export function themeCopyFor(user?: User | null) {
  return THEME_COPY[themeFor(user) ?? 'boy'];
}
