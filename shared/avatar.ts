export type Gender = 'boy' | 'girl';
export type HairStyle = 'short' | 'buzz' | 'curly' | 'bob' | 'ponytail' | 'buns';
export type FaceShape = 'round' | 'oval';
export type SkinTone = 'light' | 'tan' | 'deep';
export type Outfit = 'tee' | 'hoodie' | 'overalls' | 'blouse' | 'dress' | 'pinafore';
export type ItemSlot = 'hat' | 'face' | 'neck' | 'background' | 'pin';

export interface AvatarConfig {
  gender: Gender;
  hair: HairStyle;
  face: FaceShape;
  skin: SkinTone;
  outfit: Outfit;
  items: Partial<Record<ItemSlot, string>>;
}

export interface ShopItem {
  id: string;
  name: string;
  slot: ItemSlot;
  price: number;
  description: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'boy',
  hair: 'short',
  face: 'round',
  skin: 'light',
  outfit: 'tee',
  items: {},
};

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'boy', label: '男孩' },
  { id: 'girl', label: '女孩' },
];

export const HAIR_OPTIONS: Record<Gender, { id: HairStyle; label: string }[]> = {
  boy: [
    { id: 'short', label: '短发' },
    { id: 'buzz', label: '寸头' },
    { id: 'curly', label: '卷发' },
  ],
  girl: [
    { id: 'bob', label: '波波头' },
    { id: 'ponytail', label: '马尾' },
    { id: 'buns', label: '丸子头' },
  ],
};

export const FACE_OPTIONS: { id: FaceShape; label: string }[] = [
  { id: 'round', label: '圆脸' },
  { id: 'oval', label: '鹅蛋脸' },
];

export const SKIN_OPTIONS: { id: SkinTone; label: string; color: string }[] = [
  { id: 'light', label: '浅色', color: '#f3d3b3' },
  { id: 'tan', label: '小麦色', color: '#d9a273' },
  { id: 'deep', label: '深色', color: '#9a6440' },
];

export const OUTFIT_OPTIONS: Record<Gender, { id: Outfit; label: string; color: string }[]> = {
  boy: [
    { id: 'tee', label: '短袖', color: '#5e9b4e' },
    { id: 'hoodie', label: '连帽衫', color: '#e8a118' },
    { id: 'overalls', label: '背带裤', color: '#4f7fa8' },
  ],
  girl: [
    { id: 'blouse', label: '衬衫', color: '#e58a9a' },
    { id: 'dress', label: '连衣裙', color: '#d97a9a' },
    { id: 'pinafore', label: '背带裙', color: '#7a9bc4' },
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
    id: 'glasses',
    name: '圆眼镜',
    slot: 'face',
    price: 80,
    description: '认真读书的样子',
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
const FACE_IDS = new Set(FACE_OPTIONS.map((item) => item.id));
const SKIN_IDS = new Set(SKIN_OPTIONS.map((item) => item.id));
const OUTFIT_IDS = new Set(
  Object.values(OUTFIT_OPTIONS).flatMap((list) => list.map((item) => item.id)),
);
const SLOT_IDS = new Set<ItemSlot>(['hat', 'face', 'neck', 'background', 'pin']);

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== 'object') return false;
  const avatar = value as Record<string, unknown>;
  if (avatar.gender !== 'boy' && avatar.gender !== 'girl') return false;
  if (typeof avatar.hair !== 'string' || !HAIR_IDS.has(avatar.hair as HairStyle)) return false;
  if (typeof avatar.face !== 'string' || !FACE_IDS.has(avatar.face as FaceShape)) return false;
  if (typeof avatar.skin !== 'string' || !SKIN_IDS.has(avatar.skin as SkinTone)) return false;
  if (typeof avatar.outfit !== 'string' || !OUTFIT_IDS.has(avatar.outfit as Outfit)) return false;
  const items = avatar.items;
  if (!items || typeof items !== 'object') return false;
  for (const [slot, item] of Object.entries(items)) {
    if (!SLOT_IDS.has(slot as ItemSlot) || typeof item !== 'string') return false;
    const found = itemById(item);
    if (!found || found.slot !== slot) return false;
  }
  return true;
}

export function parseAvatar(raw: unknown): AvatarConfig | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isAvatarConfig(value) ? value : null;
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
