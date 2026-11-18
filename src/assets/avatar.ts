import type { AvatarConfig, Gender } from '../../shared/avatar';

// Layered 3D renders: every layer is authored on the same 1024x1536 canvas,
// so a single stacked <img> set composes any combination. Only the layers that
// change between options are stored (skin, bottom, top, hair) — 19 files for
// 2 genders x 3 skins x 3 hairs x 3 outfits instead of 54 pre-composed images.
const layerModules = import.meta.glob('./avatar/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const AVATAR_CANVAS = { width: 1024, height: 1536 } as const;

// The sidebar chip crops this square out of the full canvas: 600px wide,
// starting slightly above the canvas so long hair (ponytail, buns) is not cut.
export const AVATAR_BUST = { x: 212, y: -5, size: 600 } as const;

const DEFAULT_HAIR: Record<Gender, string> = { boy: 'hair-short', girl: 'hair-bob' };
const DEFAULT_TOP: Record<Gender, string> = { boy: 'top-tee', girl: 'top-blouse' };
// Girl outfits are complete dresses, so they have no separate bottom layer.
const BOTTOM_BY_OUTFIT: Partial<Record<AvatarConfig['outfit'], string>> = {
  tee: 'bottom-shorts',
  hoodie: 'bottom-shorts',
};

function url(gender: Gender, name: string, fallback: string): string {
  return (
    layerModules[`./avatar/${gender}/${name}.webp`] ??
    layerModules[`./avatar/${gender}/${fallback}.webp`] ??
    ''
  );
}

/** Bottom-to-top paint order: skin, bottoms, top, hair. */
export function avatarLayers(config: AvatarConfig): string[] {
  const bottom = BOTTOM_BY_OUTFIT[config.outfit];
  return [
    url(config.gender, `skin-${config.skin}`, 'skin-light'),
    bottom ? url(config.gender, bottom, 'bottom-shorts') : '',
    url(config.gender, `top-${config.outfit}`, DEFAULT_TOP[config.gender]),
    url(config.gender, `hair-${config.hair}`, DEFAULT_HAIR[config.gender]),
  ].filter(Boolean);
}
