import type { User } from '../../shared/types';

// The visual skin follows the avatar the child already picked, so there is no
// second "theme" setting to maintain. A user without a gender (for example a
// teacher account that never opened the avatar editor) keeps the default green
// palette.
export type ThemeId = 'boy' | 'girl';

export function themeFor(user?: User | null): ThemeId | null {
  const gender = user?.avatar?.gender;
  return gender === 'girl' || gender === 'boy' ? gender : null;
}

const THEME_COLOR: Record<ThemeId, string> = {
  boy: '#12161c',
  girl: '#fff6fa',
};
const DEFAULT_THEME_COLOR = '#f6f8ef';

export function applyTheme(theme: ThemeId | null) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  // The mobile browser chrome has to follow the skin too, otherwise a dark
  // page sits under a light status bar and looks like a rendering glitch.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme ? THEME_COLOR[theme] : DEFAULT_THEME_COLOR);
}

export const THEME_COPY: Record<ThemeId, { badge: string; hint: string; note: string }> = {
  boy: {
    badge: '🤖 机甲小队',
    hint: '带上小搭档，去发现一个新单词。',
    note: '像齿轮一样，一点点咬合，一点点变大。',
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
