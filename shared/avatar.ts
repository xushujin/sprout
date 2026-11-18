export type Gender = 'boy' | 'girl';
export type HairStyle = 'short' | 'buzz' | 'curly' | 'bob' | 'ponytail' | 'buns';
export type SkinTone = 'light' | 'tan' | 'deep';
export type Outfit =
  | 'tee'
  | 'hoodie'
  | 'overalls'
  | 'royal'
  | 'ceremony'
  | 'blouse'
  | 'dress'
  | 'pinafore'
  | 'lavender'
  | 'blush';
export type ItemSlot = 'hat' | 'face' | 'neck' | 'background' | 'pin';

export interface AvatarConfig {
  gender: Gender;
  hair: HairStyle;
  skin: SkinTone;
  outfit: Outfit;
  /**
   * 历史数据兼容：装饰已从形象编辑中移除，页面也不再渲染。
   * 字段与商城接口保留，已购买的装饰不会丢失，将来恢复时可直接沿用。
   */
  items?: Partial<Record<ItemSlot, string>>;
}

export interface ShopItem {
  id: string;
  name: string;
  slot: ItemSlot;
  price: number;
  description: string;
  /** Purchased before this item was retired; keep it valid but hide it from the shop. */
  hidden?: boolean;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'boy',
  hair: 'buzz',
  skin: 'light',
  outfit: 'tee',
};

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'boy', label: '男孩' },
  { id: 'girl', label: '女孩' },
];

export const HAIR_OPTIONS: Record<Gender, { id: HairStyle; label: string }[]> = {
  boy: [
    { id: 'buzz', label: '寸头' },
    { id: 'short', label: '短发' },
    { id: 'curly', label: '卷发' },
  ],
  girl: [
    { id: 'bob', label: '波波头' },
    { id: 'ponytail', label: '马尾' },
    { id: 'buns', label: '丸子头' },
  ],
};

export const SKIN_OPTIONS: { id: SkinTone; label: string; color: string }[] = [
  { id: 'light', label: '自然色', color: '#f7cfb4' },
  { id: 'tan', label: '小麦色', color: '#dfa070' },
  { id: 'deep', label: '深肤色', color: '#7a4a32' },
];

export const OUTFIT_OPTIONS: Record<Gender, { id: Outfit; label: string; color: string }[]> = {
  boy: [
    { id: 'tee', label: '短袖', color: '#5e9b4e' },
    { id: 'hoodie', label: '连帽衫', color: '#e8a118' },
    { id: 'overalls', label: '背带裤', color: '#4f7fa8' },
    { id: 'royal', label: '紫色礼服', color: '#6b4b9e' },
    { id: 'ceremony', label: '蓝色盛装', color: '#2f4a7a' },
  ],
  girl: [
    { id: 'blouse', label: '衬衫', color: '#e58a9a' },
    { id: 'dress', label: '连衣裙', color: '#d97a9a' },
    { id: 'pinafore', label: '背带裙', color: '#7a9bc4' },
    { id: 'lavender', label: '紫罗兰礼服', color: '#b48ad4' },
    { id: 'blush', label: '粉色礼服', color: '#e58fa8' },
  ],
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'straw_hat',
    name: '小草帽',
    slot: 'hat',
    price: 120,
    description: '去花园晒太阳',
  },
  {
    id: 'headphones',
    name: '小耳机',
    slot: 'face',
    price: 120,
    description: '把音乐戴在头上',
  },
  {
    id: 'glasses',
    name: '圆眼镜',
    slot: 'face',
    price: 80,
    description: '认真读书的样子',
    hidden: true,
  },
  {
    id: 'scarf',
    name: '红围巾',
    slot: 'neck',
    price: 100,
    description: '冬天也暖暖的',
  },
  {
    id: 'crown',
    name: '小皇冠',
    slot: 'hat',
    price: 300,
    description: '今天我是小国王',
  },
  {
    id: 'stars',
    name: '星星背景',
    slot: 'background',
    price: 200,
    description: '把夜空装进头像',
  },
  {
    id: 'brooch',
    name: '向日葵胸针',
    slot: 'pin',
    price: 150,
    description: '把花园别在身上',
  },
];

const HAIR_IDS = new Set(
  Object.values(HAIR_OPTIONS).flatMap((list) => list.map((item) => item.id)),
);
const SKIN_IDS = new Set(SKIN_OPTIONS.map((item) => item.id));
const OUTFIT_IDS = new Set(
  Object.values(OUTFIT_OPTIONS).flatMap((list) => list.map((item) => item.id)),
);
const SLOT_IDS = new Set<ItemSlot>(['hat', 'face', 'neck', 'background', 'pin']);

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

function isGender(value: unknown): value is Gender {
  return value === 'boy' || value === 'girl';
}

/** Only stored decorations that still match a known item and slot survive. */
function parseItems(raw: unknown): AvatarConfig['items'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const items: Partial<Record<ItemSlot, string>> = {};
  for (const [slot, value] of Object.entries(raw)) {
    if (!SLOT_IDS.has(slot as ItemSlot) || typeof value !== 'string') continue;
    const found = itemById(value);
    if (found && found.slot === slot) items[slot as ItemSlot] = value;
  }
  return Object.keys(items).length ? items : undefined;
}

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== 'object') return false;
  const avatar = value as Record<string, unknown>;
  if (!isGender(avatar.gender)) return false;
  if (typeof avatar.hair !== 'string' || !HAIR_IDS.has(avatar.hair as HairStyle)) return false;
  if (typeof avatar.skin !== 'string' || !SKIN_IDS.has(avatar.skin as SkinTone)) return false;
  if (typeof avatar.outfit !== 'string' || !OUTFIT_IDS.has(avatar.outfit as Outfit)) return false;
  const items = avatar.items;
  if (items !== undefined) {
    if (!items || typeof items !== 'object' || Array.isArray(items)) return false;
    for (const [slot, item] of Object.entries(items)) {
      if (!SLOT_IDS.has(slot as ItemSlot) || typeof item !== 'string') return false;
      const found = itemById(item);
      if (!found || found.slot !== slot) return false;
    }
  }
  return true;
}

/**
 * Hair and outfit must belong to the selected gender. Stored rows always did,
 * but older or hand-edited data may not, so reads coerce instead of failing.
 */
export function normalizeAvatar(value: AvatarConfig): AvatarConfig {
  const hair = HAIR_OPTIONS[value.gender].some((item) => item.id === value.hair)
    ? value.hair
    : HAIR_OPTIONS[value.gender][0].id;
  const outfit = OUTFIT_OPTIONS[value.gender].some((item) => item.id === value.outfit)
    ? value.outfit
    : OUTFIT_OPTIONS[value.gender][0].id;
  const items = value.items ? parseItems(value.items) : undefined;
  return {
    gender: value.gender,
    hair,
    skin: value.skin,
    outfit,
    ...(items ? { items } : {}),
  };
}

export function parseAvatar(raw: unknown): AvatarConfig | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isAvatarConfig(value) ? normalizeAvatar(value) : null;
  } catch {
    return null;
  }
}

export function parseOwned(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}
