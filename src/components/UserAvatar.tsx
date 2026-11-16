import {
  DEFAULT_AVATAR,
  OUTFIT_OPTIONS,
  SKIN_OPTIONS,
  type AvatarConfig,
  type HairStyle,
} from '../../shared/avatar';

function HairBack({ style, color }: { style: HairStyle; color: string }) {
  if (style !== 'bob' && style !== 'ponytail') return null;
  return (
    <g fill={color}>
      <path d="M28 58c0-24 12-36 32-36s32 12 32 36v20c0 6-8 8-10 2-2-12-8-18-22-18s-20 6-22 18c-2 6-10 4-10-2Z" />
      {style === 'ponytail' && (
        <>
          <path d="M88 48c10 6 13 16 11 27-2 10-8 15-14 13-4-2-2-8 2-11 6-5 5-17-3-22Z" />
          <circle cx="88" cy="49" r="3.2" fill="#d9534f" />
        </>
      )}
    </g>
  );
}

function HairFront({ style, color }: { style: HairStyle; color: string }) {
  if (style === 'short')
    return (
      <path
        d="M34 54c-1-19 10-30 26-30s27 11 26 30c-3-10-9-15-15-16-4 7-15 9-25 7-5-1-9 2-12 9Z"
        fill={color}
      />
    );
  if (style === 'buzz')
    return (
      <path d="M37 50c0-15 10-23 23-23s23 8 23 23c-6-8-13-11-23-11s-17 3-23 11Z" fill={color} />
    );
  if (style === 'curly')
    return (
      <g fill={color}>
        <path d="M34 54c0-18 11-28 26-28s26 10 26 28c-6-10-15-14-26-14s-20 4-26 14Z" />
        <circle cx="38" cy="40" r="10" />
        <circle cx="48" cy="31" r="11" />
        <circle cx="61" cy="28" r="12" />
        <circle cx="74" cy="33" r="11" />
        <circle cx="83" cy="44" r="9" />
      </g>
    );
  if (style === 'buns')
    return (
      <g fill={color}>
        <path d="M35 50c2-17 12-26 25-26s23 9 25 26c-6-7-14-10-25-10s-19 3-25 10Z" />
        <circle cx="36" cy="28" r="10" />
        <circle cx="84" cy="28" r="10" />
      </g>
    );
  return <path d="M35 50c2-17 12-26 25-26s23 9 25 26c-6-7-14-10-25-10s-19 3-25 10Z" fill={color} />;
}

function OutfitDetails({ outfit, color }: { outfit: AvatarConfig['outfit']; color: string }) {
  if (outfit === 'hoodie')
    return (
      <>
        <ellipse cx="60" cy="88" rx="25" ry="12" fill={color} opacity=".75" />
        <path d="M52 90v9M68 90v9" stroke="#fff" strokeWidth="1.6" opacity=".55" />
        <path d="M44 108h32" stroke="#000" strokeWidth="1.4" opacity=".12" />
      </>
    );
  if (outfit === 'overalls')
    return (
      <>
        <path d="M46 90v28h28V90" fill="#3f6e96" opacity=".65" />
        <path d="M48 92 42 82M72 92l6-10" stroke="#3f6e96" strokeWidth="3" />
        <rect x="52" y="98" width="16" height="10" rx="3" fill="#3f6e96" opacity=".45" />
      </>
    );
  return <path d="M52 89q8 6 16 0" stroke="#000" strokeWidth="1.4" opacity=".12" fill="none" />;
}

function Accessories({ avatar }: { avatar: AvatarConfig }) {
  const { items } = avatar;
  return (
    <>
      {items.neck === 'scarf' && (
        <>
          <path d="M44 84q16 10 32 0v9q-16 10-32 0Z" fill="#d9534f" />
          <path d="M70 92l6 16 8-4-6-14Z" fill="#c94a46" />
        </>
      )}
      {items.face === 'glasses' && (
        <g fill="none" stroke="#3b2a1a" strokeWidth="2">
          <circle cx="51" cy="58" r="7" />
          <circle cx="69" cy="58" r="7" />
          <path d="M58 58h4M44 57l-6-2M76 57l6-2" />
          <circle cx="51" cy="58" r="6" fill="#fff" opacity=".18" stroke="none" />
          <circle cx="69" cy="58" r="6" fill="#fff" opacity=".18" stroke="none" />
        </g>
      )}
      {items.hat === 'straw_hat' && (
        <>
          <ellipse cx="60" cy="33" rx="38" ry="9" fill="#e8c77a" />
          <path d="M38 33c0-14 9-22 22-22s22 8 22 22Z" fill="#f0d48c" />
          <rect x="38" y="29" width="44" height="6" rx="3" fill="#d9a85c" />
        </>
      )}
      {items.hat === 'crown' && (
        <>
          <path
            d="M42 32l4-16 8 9 6-14 6 14 8-9 4 16Z"
            fill="#f2c94c"
            stroke="#d9a520"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="17" r="2" fill="#e58a8a" />
        </>
      )}
      {items.pin === 'brooch' && (
        <g transform="translate(80 103)">
          {Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={0}
              cy={-3.2}
              r={2.1}
              fill="#ef9f27"
              transform={`rotate(${i * 60})`}
            />
          ))}
          <circle r="2.4" fill="#854f0b" />
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
  const config = avatar ?? DEFAULT_AVATAR;
  const skin = SKIN_OPTIONS.find((item) => item.id === config.skin)?.color ?? '#f3d3b3';
  const outfit = OUTFIT_OPTIONS.find((item) => item.id === config.outfit);
  const outfitColor = outfit?.color ?? '#6fa24a';
  const hair = '#3b2a1a';
  const stars = config.items?.background === 'stars';

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`user-avatar ${className}`.trim()}
      role="img"
      aria-label="我的形象"
    >
      {stars ? (
        <>
          <rect x="3" y="3" width="114" height="114" rx="30" fill="#2f3e6b" />
          {[
            [20, 24, 1.6],
            [36, 16, 1.1],
            [96, 30, 1.4],
            [82, 14, 1],
            [14, 52, 1.1],
            [104, 58, 1.2],
            [26, 92, 1.2],
            [98, 90, 1.5],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f6db83" opacity=".9" />
          ))}
        </>
      ) : (
        <circle cx="60" cy="60" r="56" fill="#eef4e0" />
      )}

      <HairBack style={config.hair} color={hair} />
      <rect x="52" y="76" width="16" height="16" rx="7" fill={skin} />
      <path d="M20 118c1-20 16-31 40-31s39 11 40 31Z" fill={outfitColor} />
      <OutfitDetails outfit={config.outfit} color={outfitColor} />

      <circle cx="35" cy="60" r="5" fill={skin} />
      <circle cx="85" cy="60" r="5" fill={skin} />
      {config.face === 'round' ? (
        <ellipse cx="60" cy="57" rx="25" ry="26" fill={skin} />
      ) : (
        <ellipse cx="60" cy="56" rx="23" ry="28" fill={skin} />
      )}

      <ellipse cx="51" cy="58" rx="2.2" ry="2.6" fill="#3b2a1a" />
      <ellipse cx="69" cy="58" rx="2.2" ry="2.6" fill="#3b2a1a" />
      <circle cx="51.7" cy="57.2" r=".8" fill="#fff" />
      <circle cx="69.7" cy="57.2" r=".8" fill="#fff" />
      <path d="M47 50q4-2 8 0M65 50q4-2 8 0" stroke={hair} strokeWidth="1.5" opacity=".65" />
      <path
        d="M53 68q7 5 14 0"
        stroke="#8a5a44"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="44" cy="66" r="4" fill="#f29b9b" opacity=".35" />
      <circle cx="76" cy="66" r="4" fill="#f29b9b" opacity=".35" />

      <HairFront style={config.hair} color={hair} />
      <Accessories avatar={config} />
    </svg>
  );
}
