import { useId } from 'react';
import {
  DEFAULT_AVATAR,
  type AvatarConfig,
  type HairStyle,
  type Outfit,
  type SkinTone,
} from '../../shared/avatar';

const SKIN_TONES: Record<SkinTone, { base: string; shade: string; line: string }> = {
  light: { base: '#f3d3b3', shade: '#ecc4a2', line: '#d9a47e' },
  tan: { base: '#d9a273', shade: '#cf9564', line: '#b57a4c' },
  deep: { base: '#9a6440', shade: '#8d5836', line: '#74452a' },
};

const OUTFITS: Record<Outfit, { base: string; shade: string; light: string }> = {
  tee: { base: '#5e9b4e', shade: '#4a7c3d', light: '#78b566' },
  hoodie: { base: '#e8a118', shade: '#c9850f', light: '#f3bd4a' },
  overalls: { base: '#4f7fa8', shade: '#3c6688', light: '#6f9cc2' },
  blouse: { base: '#e58a9a', shade: '#c96f80', light: '#f2a7b4' },
  dress: { base: '#d97a9a', shade: '#b85f7e', light: '#ea9ab4' },
  pinafore: { base: '#7a9bc4', shade: '#5f7fa8', light: '#98b6d9' },
};

const HAIR = { base: '#3b2a1a', light: '#6a4a2f' };

function HairBack({ style, color }: { style: HairStyle; color: string }) {
  if (style !== 'bob' && style !== 'ponytail') return null;
  return (
    <g>
      <path
        d="M38 82c0-30 17-48 42-48s42 18 42 48v22c0 9-11 11-14 3-3-15-12-23-28-23s-25 8-28 23c-3 8-14 6-14-3Z"
        fill={color}
      />
      {style === 'ponytail' && (
        <>
          <path
            d="M112 54c16 8 21 24 17 38-3 12-11 18-17 14-4-3-1-9 4-13 8-6 6-22-6-28Z"
            fill={color}
          />
          <circle cx="112" cy="56" r="4" fill="#d9534f" />
        </>
      )}
    </g>
  );
}

function HairFront({ style, color, light }: { style: HairStyle; color: string; light: string }) {
  if (style === 'short')
    return (
      <g>
        <path
          d="M40 76c-2-28 15-44 40-44s42 16 40 44c-4-16-12-24-22-26-6 9-19 13-33 11-9-1-17 4-25 15Z"
          fill={color}
        />
        <path
          d="M52 46c10-8 22-10 34-7"
          stroke={light}
          strokeWidth="3"
          opacity=".5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M41 70c0-8 1-14 3-18M119 70c0-8-1-14-3-18"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    );
  if (style === 'buzz')
    return (
      <g>
        <path d="M45 70c0-22 15-34 35-34s35 12 35 34c-8-13-20-19-35-19s-27 6-35 19Z" fill={color} />
        <g stroke={light} strokeWidth="1.2" opacity=".4" strokeLinecap="round">
          <path d="M54 56c4-4 9-6 14-7M66 48c5-2 10-2 15 0M84 48c5 2 10 5 13 9M94 58c3 3 5 6 6 10" />
        </g>
      </g>
    );
  if (style === 'curly')
    return (
      <g>
        <path
          d="M40 76c0-26 16-42 40-42s40 16 40 42c-8-14-18-20-30-20-4 6-10 9-18 9s-14-3-18-9c-6 2-10 8-14 20Z"
          fill={color}
        />
        <g fill={color}>
          <circle cx="48" cy="52" r="11" />
          <circle cx="60" cy="42" r="12" />
          <circle cx="76" cy="38" r="13" />
          <circle cx="92" cy="42" r="12" />
          <circle cx="106" cy="52" r="11" />
        </g>
        <path
          d="M56 40c8-6 18-8 28-6"
          stroke={light}
          strokeWidth="2.5"
          opacity=".45"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  if (style === 'buns')
    return (
      <g>
        <g fill={color}>
          <path d="M46 66c4-20 16-31 34-31s30 11 34 31c-8-9-19-13-34-13s-26 4-34 13Z" />
          <circle cx="48" cy="40" r="14" />
          <circle cx="112" cy="40" r="14" />
        </g>
        <path
          d="M42 40c2-6 7-9 13-9M105 31c6 0 11 3 13 9"
          stroke={light}
          strokeWidth="2.5"
          opacity=".45"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  return (
    <g>
      <path d="M46 66c4-20 16-31 34-31s30 11 34 31c-8-9-19-13-34-13s-26 4-34 13Z" fill={color} />
      <path
        d="M52 48c10-8 22-10 34-7"
        stroke={light}
        strokeWidth="3"
        opacity=".5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 78c-1 10 0 20 3 28M116 78c1 10 0 20-3 28"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

function OutfitLayer({ outfit, colors }: { outfit: Outfit; colors: (typeof OUTFITS)[Outfit] }) {
  if (outfit === 'hoodie')
    return (
      <g>
        <ellipse cx="80" cy="120" rx="30" ry="15" fill={colors.shade} />
        <ellipse cx="80" cy="122" rx="22" ry="9" fill="#000" opacity=".12" />
        <path d="M72 126v20M88 126v20" stroke="#fff" strokeWidth="2" opacity=".65" />
        <circle cx="72" cy="147" r="2" fill="#fff" opacity=".7" />
        <circle cx="88" cy="147" r="2" fill="#fff" opacity=".7" />
        <path d="M58 142h44v14H58Z" fill={colors.shade} opacity=".45" />
        <path d="M40 158h80" stroke={colors.shade} strokeWidth="3" />
      </g>
    );
  if (outfit === 'overalls')
    return (
      <g>
        <path d="M24 160c2-30 24-44 56-44s54 14 56 44Z" fill="#f4e8d0" />
        <path d="M58 126h44v34H58Z" fill={colors.base} />
        <path d="M62 126l-8-12M98 126l8-12" stroke={colors.shade} strokeWidth="4" />
        <circle cx="62" cy="126" r="2.5" fill="#f2c94c" />
        <circle cx="98" cy="126" r="2.5" fill="#f2c94c" />
        <rect x="72" y="136" width="16" height="12" rx="3" fill={colors.shade} opacity=".4" />
        <path d="M66 120q14 8 28 0" stroke={colors.shade} strokeWidth="2" fill="none" />
      </g>
    );
  if (outfit === 'blouse')
    return (
      <g>
        <circle cx="34" cy="142" r="16" fill={colors.base} />
        <circle cx="126" cy="142" r="16" fill={colors.base} />
        <path d="M64 120q16 12 32 0" fill="#fff4e2" />
        <path d="M80 124v30" stroke="#fff" strokeWidth="2" opacity=".45" />
        <circle cx="80" cy="134" r="1.6" fill="#fff" opacity=".8" />
        <circle cx="80" cy="143" r="1.6" fill="#fff" opacity=".8" />
        <path d="M74 120l-6-4 6-4 6 4Z" fill={colors.shade} />
        <path d="M86 120l6-4-6-4-6 4Z" fill={colors.shade} />
        <circle cx="80" cy="117" r="2.5" fill={colors.shade} />
      </g>
    );
  if (outfit === 'dress')
    return (
      <g>
        <path d="M46 142h68l12 18H34Z" fill={colors.shade} opacity=".55" />
        <path d="M52 142h56" stroke="#fff" strokeWidth="2" opacity=".4" />
        <path
          d="M36 132c-6 8-8 14-8 20M124 132c6 8 8 14 8 20"
          stroke={colors.base}
          strokeWidth="9"
        />
        <path d="M64 120q16 10 32 0" stroke="#fff" strokeWidth="2" opacity=".45" fill="none" />
        <path d="M72 142l-6-4 6-4 6 4Z" fill={colors.shade} />
        <path d="M88 142l6-4-6-4-6 4Z" fill={colors.shade} />
        <circle cx="80" cy="140" r="2.5" fill={colors.shade} />
      </g>
    );
  if (outfit === 'pinafore')
    return (
      <g>
        <path d="M24 160c2-30 24-44 56-44s54 14 56 44Z" fill="#fff4e2" />
        <path d="M48 144h64l10 16H38Z" fill={colors.base} />
        <path d="M62 128h36v16H62Z" fill={colors.base} />
        <path d="M64 128l-8-10M96 128l8-10" stroke={colors.shade} strokeWidth="4" />
        <circle cx="64" cy="128" r="2.5" fill="#f2c94c" />
        <circle cx="96" cy="128" r="2.5" fill="#f2c94c" />
        <path
          d="M80 134c-3-3-8 0-8 4 0 4 8 8 8 8s8-4 8-8c0-4-5-7-8-4Z"
          fill="#e58a9a"
          opacity=".8"
        />
      </g>
    );
  return (
    <g>
      <path d="M66 120q14 10 28 0" stroke={colors.shade} strokeWidth="3" fill="none" />
      <path
        d="M36 150c2-14 8-22 16-26M124 150c-2-14-8-22-16-26"
        stroke={colors.shade}
        strokeWidth="2"
        opacity=".45"
        fill="none"
      />
      <rect x="98" y="132" width="16" height="14" rx="3" fill={colors.shade} opacity=".35" />
    </g>
  );
}

function Face({
  avatar,
  skin,
  shade,
  line,
}: {
  avatar: AvatarConfig;
  skin: string;
  shade: string;
  line: string;
}) {
  const girl = avatar.gender === 'girl';
  const head =
    girl && avatar.face === 'round'
      ? 'M80 36c-23 0-36 17-36 42 0 24 15 43 36 43s36-19 36-43c0-25-13-42-36-42Z'
      : girl
        ? 'M80 36c-21 0-34 17-34 43 0 25 13 48 34 48s34-23 34-48c0-26-13-43-34-43Z'
        : avatar.face === 'round'
          ? 'M80 36c-25 0-40 17-40 43 0 28 18 45 40 45s40-17 40-45c0-26-15-43-40-43Z'
          : 'M80 34c-22 0-36 18-36 44 0 29 16 48 36 48s36-19 36-48c0-26-14-44-36-44Z';
  const jaw = girl
    ? avatar.face === 'round'
      ? 'M48 92c4 18 16 29 32 29'
      : 'M46 92c4 20 17 32 34 32'
    : avatar.face === 'round'
      ? 'M40 92c5 22 20 32 40 32'
      : 'M44 92c5 22 18 32 36 32';
  const eyeY = 82;
  const leftX = girl ? 64 : 63;
  const rightX = girl ? 96 : 97;

  return (
    <g>
      <path d={head} fill={skin} />
      <path
        d={jaw}
        stroke={shade}
        strokeWidth="4"
        opacity=".35"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="72" cy="56" rx="18" ry="9" fill="#fff" opacity=".12" />

      {girl ? (
        <>
          <g>
            <ellipse cx={leftX} cy={eyeY} rx="9.5" ry="8" fill="#fff" />
            <circle cx={leftX + 1} cy={eyeY} r="5.2" fill="#7a5230" />
            <circle cx={leftX + 1} cy={eyeY} r="2.4" fill="#2a1d12" />
            <circle cx={leftX + 2.8} cy={eyeY - 2} r="1.5" fill="#fff" />
            <circle cx={leftX - 1.5} cy={eyeY + 2} r=".9" fill="#fff" opacity=".8" />
            <path
              d={`M${leftX - 9.5} ${eyeY - 2}q9.5-9 19 0`}
              stroke="#3b2a1a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${leftX - 7} ${eyeY - 4}l-3-2M${leftX - 8} ${eyeY - 1}l-3-1`}
              stroke="#3b2a1a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d={`M${leftX - 10} ${eyeY - 11}q10-5 20-1`}
              stroke={HAIR.base}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g>
            <ellipse cx={rightX} cy={eyeY} rx="9.5" ry="8" fill="#fff" />
            <circle cx={rightX - 1} cy={eyeY} r="5.2" fill="#7a5230" />
            <circle cx={rightX - 1} cy={eyeY} r="2.4" fill="#2a1d12" />
            <circle cx={rightX + 1.8} cy={eyeY - 2} r="1.5" fill="#fff" />
            <circle cx={rightX - 2.5} cy={eyeY + 2} r=".9" fill="#fff" opacity=".8" />
            <path
              d={`M${rightX - 9.5} ${eyeY - 2}q9.5-9 19 0`}
              stroke="#3b2a1a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${rightX + 7} ${eyeY - 4}l3-2M${rightX + 8} ${eyeY - 1}l3-1`}
              stroke="#3b2a1a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d={`M${rightX - 10} ${eyeY - 11}q10-5 20-1`}
              stroke={HAIR.base}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M80 90q-2 6 1 7"
            stroke={line}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="78.5" cy="97" r=".8" fill={line} opacity=".7" />
          <path d="M71 101q9-3 18 0" fill="#d98a95" />
          <path d="M71 101q9 7 18 0" fill="#eda6ae" />
          <path d="M71 101q9 1 18 0" stroke="#c97a86" strokeWidth="1" fill="none" />
        </>
      ) : (
        <>
          <g>
            <ellipse cx={leftX} cy={eyeY} rx="9" ry="6" fill="#fff" />
            <circle cx={leftX + 1} cy={eyeY} r="4.6" fill="#6b4a2f" />
            <circle cx={leftX + 1} cy={eyeY} r="2.2" fill="#2a1d12" />
            <circle cx={leftX + 2.5} cy={eyeY - 1.5} r="1.3" fill="#fff" />
            <path
              d={`M${leftX - 9} ${eyeY}q9-7 18 0`}
              stroke="#3b2a1a"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${leftX - 10} ${eyeY - 10}q10-4 20 0`}
              stroke={HAIR.base}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g>
            <ellipse cx={rightX} cy={eyeY} rx="9" ry="6" fill="#fff" />
            <circle cx={rightX - 1} cy={eyeY} r="4.6" fill="#6b4a2f" />
            <circle cx={rightX - 1} cy={eyeY} r="2.2" fill="#2a1d12" />
            <circle cx={rightX + 1.5} cy={eyeY - 1.5} r="1.3" fill="#fff" />
            <path
              d={`M${rightX - 9} ${eyeY}q9-7 18 0`}
              stroke="#3b2a1a"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${rightX - 10} ${eyeY - 10}q10-4 20 0`}
              stroke={HAIR.base}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M80 90q-2 6 1 7"
            stroke={line}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M70 102q10 6 20 0"
            stroke="#8a5a44"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M74 104q6 3 12 0"
            stroke="#fff"
            strokeWidth="1.2"
            opacity=".2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      <circle cx="50" cy="94" r="8" fill="#f29b9b" opacity=".28" />
      <circle cx="110" cy="94" r="8" fill="#f29b9b" opacity=".28" />
    </g>
  );
}

function Accessories({ avatar }: { avatar: AvatarConfig }) {
  const { items } = avatar;
  return (
    <>
      {items.neck === 'scarf' && (
        <>
          <path d="M58 116q22 14 44 0v12q-22 14-44 0Z" fill="#d9534f" />
          <path d="M98 128l8 22 10-5-8-19Z" fill="#c94a46" />
        </>
      )}
      {items.face === 'glasses' && (
        <g fill="none" stroke="#3b2a1a" strokeWidth="2.2">
          <circle cx="64" cy="82" r="10" />
          <circle cx="96" cy="82" r="10" />
          <path d="M74 82h12M54 80l-10-2M106 80l10-2" />
          <circle cx="64" cy="82" r="8.5" fill="#fff" opacity=".16" stroke="none" />
          <circle cx="96" cy="82" r="8.5" fill="#fff" opacity=".16" stroke="none" />
        </g>
      )}
      {items.hat === 'straw_hat' && (
        <>
          <ellipse cx="80" cy="44" rx="52" ry="12" fill="#e8c77a" />
          <path d="M50 44c0-20 13-30 30-30s30 10 30 30Z" fill="#f0d48c" />
          <rect x="50" y="38" width="60" height="8" rx="4" fill="#d9a85c" />
        </>
      )}
      {items.hat === 'crown' && (
        <>
          <path
            d="M54 44l6-22 11 12 9-18 9 18 11-12 6 22Z"
            fill="#f2c94c"
            stroke="#d9a520"
            strokeWidth="1.6"
          />
          <circle cx="80" cy="24" r="2.5" fill="#e58a8a" />
          <circle cx="64" cy="32" r="1.8" fill="#e58a8a" />
          <circle cx="96" cy="32" r="1.8" fill="#e58a8a" />
        </>
      )}
      {items.pin === 'brooch' && (
        <g transform="translate(108 142)">
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={0} cy={-4} r={2.6} fill="#ef9f27" transform={`rotate(${i * 60})`} />
          ))}
          <circle r="3" fill="#854f0b" />
        </g>
      )}
    </>
  );
}

export function UserAvatar({
  avatar,
  size = 96,
  className = '',
}: {
  avatar?: AvatarConfig | null;
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const config = avatar ?? DEFAULT_AVATAR;
  const skin = SKIN_TONES[config.skin];
  const outfit = OUTFITS[config.outfit];
  const stars = config.items?.background === 'stars';
  const earX =
    config.gender === 'girl'
      ? config.face === 'round'
        ? 45
        : 47
      : config.face === 'round'
        ? 42
        : 45;

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`user-avatar ${className}`.trim()}
      role="img"
      aria-label="我的形象"
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#fbfcf4" />
          <stop offset="1" stopColor="#e6efd7" />
        </radialGradient>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin.base} />
          <stop offset="1" stopColor={skin.shade} />
        </linearGradient>
        <linearGradient id={`${uid}-outfit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={outfit.light} />
          <stop offset="1" stopColor={outfit.base} />
        </linearGradient>
      </defs>

      {stars ? (
        <>
          <rect x="4" y="4" width="152" height="152" rx="40" fill="#2f3e6b" />
          {[
            [28, 32, 1.8],
            [48, 20, 1.2],
            [128, 38, 1.6],
            [112, 18, 1.1],
            [18, 68, 1.3],
            [140, 76, 1.4],
            [34, 124, 1.4],
            [130, 120, 1.7],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f6db83" opacity=".9" />
          ))}
        </>
      ) : (
        <>
          <circle cx="80" cy="80" r="76" fill={`url(#${uid}-bg)`} />
          <circle cx="80" cy="80" r="76" fill="none" stroke="#dbe6ca" strokeWidth="1.5" />
        </>
      )}

      <HairBack style={config.hair} color={HAIR.base} />

      <rect x="68" y="108" width="24" height="24" rx="10" fill={`url(#${uid}-skin)`} />
      <ellipse cx="80" cy="112" rx="12" ry="4" fill={skin.line} opacity=".25" />

      <path d="M24 160c2-30 24-44 56-44s54 14 56 44Z" fill={`url(#${uid}-outfit)`} />
      <OutfitLayer outfit={config.outfit} colors={outfit} />

      <ellipse cx={earX} cy="84" rx="7" ry="8" fill={`url(#${uid}-skin)`} />
      <ellipse cx={160 - earX} cy="84" rx="7" ry="8" fill={`url(#${uid}-skin)`} />
      <ellipse cx={earX + 2} cy="84" rx="2" ry="3" fill={skin.line} opacity=".5" />
      <ellipse cx={158 - earX} cy="84" rx="2" ry="3" fill={skin.line} opacity=".5" />

      <Face avatar={config} skin={`url(#${uid}-skin)`} shade={skin.shade} line={skin.line} />

      <HairFront style={config.hair} color={HAIR.base} light={HAIR.light} />
      <Accessories avatar={config} />
    </svg>
  );
}
