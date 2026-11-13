// Sunflower growth is derived from the lifetime local points total, never stored.
// Changing a threshold therefore re-grades every existing garden without migration.
export interface GrowthStage {
  id: 'seed' | 'sprout' | 'seedling' | 'bud' | 'bloom' | 'full' | 'seeds';
  name: string;
  min: number;
  hint: string;
}

export const GROWTH_STAGES: readonly GrowthStage[] = [
  { id: 'seed', name: '种子', min: 0, hint: '一颗种子正在土里等你' },
  { id: 'sprout', name: '发芽', min: 30, hint: '两片小叶子探出了头' },
  { id: 'seedling', name: '幼苗', min: 250, hint: '茎长高了，叶子也多了' },
  { id: 'bud', name: '花苞', min: 750, hint: '结出了第一个花苞' },
  { id: 'bloom', name: '开花', min: 1500, hint: '第一圈花瓣打开了' },
  { id: 'full', name: '盛放', min: 3000, hint: '整朵花都开了' },
  { id: 'seeds', name: '结籽', min: 6000, hint: '花盘里结满了种子' },
];

export interface Growth {
  stage: GrowthStage;
  index: number;
  next: GrowthStage | null;
  toNext: number;
  /** Progress inside the current stage, 0–1. A finished garden stays at 1. */
  progress: number;
  points: number;
}

export function growthFor(points: number): Growth {
  const safe = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  let index = 0;
  for (let i = 0; i < GROWTH_STAGES.length; i += 1) {
    if (safe >= GROWTH_STAGES[i].min) index = i;
  }
  const stage = GROWTH_STAGES[index];
  const next = GROWTH_STAGES[index + 1] ?? null;
  const span = next ? next.min - stage.min : 0;
  return {
    stage,
    index,
    next,
    toNext: next ? Math.max(0, next.min - safe) : 0,
    progress: next && span > 0 ? Math.min(1, (safe - stage.min) / span) : 1,
    points: safe,
  };
}
