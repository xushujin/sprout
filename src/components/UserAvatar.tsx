import { DEFAULT_AVATAR, type AvatarConfig } from '../../shared/avatar';
import { AVATAR_BUST, AVATAR_CANVAS, avatarLayers } from '../assets/avatar';

// The avatar is a stack of aligned 3D layers (skin, bottoms, top, hair) on one
// 1024x1536 canvas. Nothing is stitched or recolored at runtime, so switching
// gender, skin, hair or outfit only swaps which layers are painted.
//
// `bust` crops the head out of the same stack for the sidebar chip; `full`
// shows the whole body on the profile stage.
export function UserAvatar({
  avatar,
  size = 96,
  className = '',
  variant = 'bust',
}: {
  avatar?: AvatarConfig | null;
  size?: number;
  className?: string;
  variant?: 'bust' | 'full';
}) {
  const config = avatar ?? DEFAULT_AVATAR;
  const full = variant === 'full';
  const scale = full ? size / AVATAR_CANVAS.width : size / AVATAR_BUST.size;
  const height = full ? (size * AVATAR_CANVAS.height) / AVATAR_CANVAS.width : size;
  const x = full ? 0 : -AVATAR_BUST.x * scale;
  const y = full ? 0 : -AVATAR_BUST.y * scale;

  return (
    <span
      className={`user-avatar ${full ? 'user-avatar--full' : ''} ${className}`.trim()}
      style={{ width: size, height }}
      role="img"
      aria-label="我的形象"
    >
      <span
        className="user-avatar__layers"
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
      >
        {avatarLayers(config).map((src) => (
          <img key={src} src={src} alt="" draggable={false} />
        ))}
      </span>
    </span>
  );
}
