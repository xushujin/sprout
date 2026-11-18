import {
  HAIR_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_OPTIONS,
  type AvatarConfig,
  type Gender,
} from './avatar';

// Paid cosmetics. Every gender has one free hair / skin / outfit; anything else
// is unlocked once per account and then stays available across devices.
export type StyleKind = 'hair' | 'skin' | 'outfit';

export const STYLE_KINDS: StyleKind[] = ['hair', 'skin', 'outfit'];

export const STYLE_PRICE: Record<StyleKind, number> = {
  hair: 1000,
  skin: 500,
  outfit: 1500,
};

// Premium pieces cost more than the base price of their kind.
const STYLE_PRICE_OVERRIDE: Record<string, number> = {
  'outfit:royal': 3000,
  'outfit:ceremony': 3000,
  'outfit:lavender': 3000,
  'outfit:blush': 3000,
};

export function stylePrice(kind: StyleKind, id?: string): number {
  return (id && STYLE_PRICE_OVERRIDE[styleKey(kind, id)]) || STYLE_PRICE[kind];
}

export const FREE_STYLES: Record<Gender, Record<StyleKind, string>> = {
  boy: { hair: 'buzz', skin: 'light', outfit: 'tee' },
  girl: { hair: 'bob', skin: 'light', outfit: 'blouse' },
};

const ALL_IDS: Record<StyleKind, Set<string>> = {
  hair: new Set(Object.values(HAIR_OPTIONS).flatMap((list) => list.map((item) => item.id))),
  skin: new Set(SKIN_OPTIONS.map((item) => item.id)),
  outfit: new Set(Object.values(OUTFIT_OPTIONS).flatMap((list) => list.map((item) => item.id))),
};

const FREE_IDS: Record<StyleKind, Set<string>> = {
  hair: new Set(Object.values(FREE_STYLES).map((set) => set.hair)),
  skin: new Set(Object.values(FREE_STYLES).map((set) => set.skin)),
  outfit: new Set(Object.values(FREE_STYLES).map((set) => set.outfit)),
};

export function isStyleKind(value: unknown): value is StyleKind {
  return value === 'hair' || value === 'skin' || value === 'outfit';
}

export function isValidStyle(kind: StyleKind, id: unknown): id is string {
  return typeof id === 'string' && ALL_IDS[kind].has(id);
}

/** Storage key for one unlocked option: `hair:curly`, `skin:deep`, `outfit:dress`. */
export function styleKey(kind: StyleKind, id: string): string {
  return `${kind}:${id}`;
}

export function isFreeStyle(gender: Gender, kind: StyleKind, id: string): boolean {
  return FREE_STYLES[gender][kind] === id;
}

/** Free for at least one gender, so it must never be sold. */
export function isFreeStyleId(kind: StyleKind, id: string): boolean {
  return FREE_IDS[kind].has(id);
}

export function isStyleUnlocked(
  gender: Gender,
  kind: StyleKind,
  id: string,
  unlocked: ReadonlySet<string>,
): boolean {
  return isFreeStyle(gender, kind, id) || unlocked.has(styleKey(kind, id));
}

export function avatarStyleKeys(avatar: AvatarConfig): string[] {
  return [
    styleKey('hair', avatar.hair),
    styleKey('skin', avatar.skin),
    styleKey('outfit', avatar.outfit),
  ];
}

export function parseStyles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const styles = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const [kind, id] = value.split(':');
    if (isStyleKind(kind) && isValidStyle(kind, id)) styles.add(value);
  }
  return [...styles];
}

/** D1 stores the list as a JSON string, like `avatar` and `owned_items`. */
export function parseOwnedStyles(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    return parseStyles(JSON.parse(raw));
  } catch {
    return [];
  }
}
