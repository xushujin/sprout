import { useEffect, useState } from 'react';
import type { User } from '../../shared/types';
import {
  DEFAULT_AVATAR,
  GENDERS,
  HAIR_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_OPTIONS,
  type AvatarConfig,
  type Gender,
} from '../../shared/avatar';
import { isStyleUnlocked, stylePrice, type StyleKind } from '../../shared/wardrobe';
import { api } from '../lib/api';
import { UserAvatar } from '../components/UserAvatar';

interface PendingStyle {
  kind: StyleKind;
  option: string;
  label: string;
  price: number;
}

type EditorGroup = 'gender' | StyleKind;

const EDITOR_GROUPS: { id: EditorGroup; label: string }[] = [
  { id: 'gender', label: '性别' },
  { id: 'hair', label: '发型' },
  { id: 'skin', label: '肤色' },
  { id: 'outfit', label: '服饰' },
];

// Phones show a compact single-screen editor: one option group at a time,
// no page chrome, and a preview sized to the available height.
function useViewport() {
  const query = '(max-width: 760px)';
  const read = () => ({
    compact: window.matchMedia(query).matches,
    tall: window.innerHeight >= 720,
  });
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setViewport(read());
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return viewport;
}

export function Profile({
  user,
  onUserChange,
  onSpend,
}: {
  user: User;
  onUserChange: (user: User) => void;
  onSpend: (amount: number) => void;
}) {
  const [avatar, setAvatar] = useState<AvatarConfig>(user.avatar ?? DEFAULT_AVATAR);
  const [points, setPoints] = useState(user.points ?? 0);
  const [gift, setGift] = useState(user.gift_points ?? 0);
  const [unlocked, setUnlocked] = useState<string[]>(user.unlocked_styles ?? []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<PendingStyle | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [group, setGroup] = useState<EditorGroup>('hair');
  const viewport = useViewport();
  const firstTime = !user.avatar;
  const unlockedSet = new Set(unlocked);
  // While the unlock dialog is open the avatar previews the option for free.
  const previewAvatar: AvatarConfig = pending
    ? { ...avatar, [pending.kind]: pending.option }
    : avatar;

  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setConfirming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming, busy]);

  function change(patch: Partial<AvatarConfig>) {
    setAvatar((current) => ({ ...current, ...patch }));
    setDirty(true);
    setMessage('');
  }

  function changeGender(gender: Gender) {
    setPending(null);
    setConfirming(false);
    const hair = HAIR_OPTIONS[gender].some((item) => item.id === avatar.hair)
      ? avatar.hair
      : HAIR_OPTIONS[gender][0].id;
    const outfit = OUTFIT_OPTIONS[gender].some((item) => item.id === avatar.outfit)
      ? avatar.outfit
      : OUTFIT_OPTIONS[gender][0].id;
    change({ gender, hair, outfit });
  }

  function canUse(kind: StyleKind, id: string) {
    return isStyleUnlocked(avatar.gender, kind, id, unlockedSet);
  }

  function choose(kind: StyleKind, option: string, label: string) {
    if (canUse(kind, option)) {
      setPending(null);
      setConfirming(false);
      change({ [kind]: option } as Partial<AvatarConfig>);
      return;
    }
    // Locked options are tried on for free; the purchase dialog waits for an
    // explicit confirmation so the preview is never covered by a modal.
    setError('');
    setMessage('');
    setConfirming(false);
    setPending({ kind, option, label, price: stylePrice(kind, option) });
  }

  async function persist(next: AvatarConfig, extra: Partial<User> = {}, note = '') {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ avatar: AvatarConfig }>(
        '/me/avatar',
        { avatar: next },
        { method: 'PATCH' },
      );
      setAvatar(result.avatar);
      setDirty(false);
      onUserChange({ ...user, ...extra, avatar: result.avatar });
      setMessage(note);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    if (!pending || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{
        points: number;
        gift_points: number;
        spent_points: number;
        unlocked_styles: string[];
      }>('/wardrobe/unlock', { kind: pending.kind, option: pending.option }, { method: 'POST' });
      const next = { ...avatar, [pending.kind]: pending.option };
      setPoints(result.points);
      setGift(result.gift_points);
      setUnlocked(result.unlocked_styles);
      setPending(null);
      setConfirming(false);
      onSpend(result.spent_points);
      await persist(
        next,
        {
          points: result.points,
          gift_points: result.gift_points,
          unlocked_styles: result.unlocked_styles,
        },
        `已解锁「${pending.label}」，并换上了新形象。`,
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`page-enter profile-page ${pending ? 'try-on' : ''}`.trim()}>
      <div className="profile-mobile-bar">
        <h1>{firstTime ? '选择我的形象' : '我的形象'}</h1>
        <span className="profile-points-chip">🌱 {points + gift}</span>
        <button
          type="button"
          className="button primary"
          disabled={!dirty || busy || Boolean(pending)}
          onClick={() => void persist(avatar)}
        >
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MY LITTLE AVATAR</span>
          <h1>{firstTime ? '先给自己选个形象' : '我的形象'}</h1>
          <p>
            {firstTime
              ? '默认形象免费；其他发型、肤色和服饰可以用积分解锁。'
              : '换形象免费；未解锁的发型、肤色和服饰需要积分。'}
          </p>
        </div>
        <span className="page-emblem">🌱</span>
      </div>

      <div className="avatar-layout">
        <section className="avatar-preview-card">
          <div className="avatar-stage">
            <UserAvatar
              avatar={previewAvatar}
              size={viewport.compact ? (viewport.tall ? 210 : 175) : 190}
              variant="full"
            />
            {pending && <span className="avatar-preview-hint">试穿预览 · 未解锁</span>}
          </div>
          <h2>{user.display_name}</h2>
          <p className="avatar-points">
            可用积分 <strong>{points + gift}</strong>
          </p>
          {gift > 0 && <p className="avatar-gift">含奖励积分 {gift}，解锁时优先使用</p>}
          <p className="muted">
            解锁会扣当前积分和本周积分，向日葵可能退回上一阶段。形象会出现在家里、侧栏和这一页。
          </p>
        </section>

        <div className="avatar-tabs" role="tablist" aria-label="形象分类">
          {EDITOR_GROUPS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={group === tab.id}
              className={group === tab.id ? 'active' : ''}
              onClick={() => setGroup(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="avatar-editor">
          <h2>基础形象</h2>
          <div className={`avatar-group ${group === 'gender' ? 'active' : ''}`.trim()}>
            <span className="avatar-label">性别</span>
            <div className="avatar-options">
              {GENDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={avatar.gender === item.id ? 'active' : ''}
                  aria-pressed={avatar.gender === item.id}
                  onClick={() => changeGender(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`avatar-group ${group === 'hair' ? 'active' : ''}`.trim()}>
            <span className="avatar-label">发型</span>
            <div className="avatar-options">
              {HAIR_OPTIONS[avatar.gender].map((item) => {
                const locked = !canUse('hair', item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${avatar.hair === item.id ? 'active' : ''} ${locked ? 'locked' : ''}`.trim()}
                    aria-pressed={avatar.hair === item.id}
                    aria-label={`${item.label}${locked ? `，需要 ${stylePrice('hair', item.id)} 积分解锁` : ''}`}
                    onClick={() => choose('hair', item.id, item.label)}
                  >
                    {item.label}
                    {locked && <span className="option-price">{stylePrice('hair', item.id)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`avatar-group ${group === 'skin' ? 'active' : ''}`.trim()}>
            <span className="avatar-label">肤色</span>
            <div className="avatar-options">
              {SKIN_OPTIONS.map((item) => {
                const locked = !canUse('skin', item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`skin-swatch ${avatar.skin === item.id ? 'active' : ''} ${locked ? 'locked' : ''}`.trim()}
                    style={{ background: item.color }}
                    onClick={() => choose('skin', item.id, item.label)}
                    aria-label={`${item.label}${locked ? `，需要 ${stylePrice('skin', item.id)} 积分解锁` : ''}`}
                    aria-pressed={avatar.skin === item.id}
                    title={item.label}
                  >
                    {locked && <span className="skin-price">{stylePrice('skin', item.id)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`avatar-group ${group === 'outfit' ? 'active' : ''}`.trim()}>
            <span className="avatar-label">基础服饰</span>
            <div className="avatar-options">
              {OUTFIT_OPTIONS[avatar.gender].map((item) => {
                const locked = !canUse('outfit', item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${avatar.outfit === item.id ? 'active' : ''} ${locked ? 'locked' : ''}`.trim()}
                    aria-pressed={avatar.outfit === item.id}
                    aria-label={`${item.label}${locked ? `，需要 ${stylePrice('outfit', item.id)} 积分解锁` : ''}`}
                    onClick={() => choose('outfit', item.id, item.label)}
                  >
                    <span className="outfit-dot" style={{ background: item.color }} />
                    {item.label}
                    {locked && (
                      <span className="option-price">{stylePrice('outfit', item.id)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          {pending && !confirming && (
            <div className="unlock-bar" role="status">
              <div className="unlock-bar-text">
                <strong>试穿「{pending.label}」</strong>
                <span>{pending.price} 积分解锁后自动换上并保存</span>
              </div>
              <div className="unlock-bar-actions">
                <button
                  type="button"
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => setPending(null)}
                >
                  取消试穿
                </button>
                <button
                  type="button"
                  className="button primary small"
                  disabled={busy || points + gift < pending.price}
                  onClick={() => setConfirming(true)}
                >
                  {points + gift < pending.price ? '积分不够' : '解锁并穿上'}
                </button>
              </div>
            </div>
          )}
          <div className="avatar-actions">
            <button
              className="button primary"
              disabled={!dirty || busy || Boolean(pending)}
              onClick={() => void persist(avatar)}
            >
              {busy ? '保存中…' : '保存形象'}
            </button>
            {pending ? (
              <span className="muted">试穿中，解锁或取消后才能保存</span>
            ) : (
              dirty && <span className="muted">有未保存的修改</span>
            )}
          </div>
          {pending && confirming && (
            <div
              className="unlock-overlay"
              role="presentation"
              onClick={() => {
                if (!busy) setConfirming(false);
              }}
            >
              <div
                className="unlock-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="unlock-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="unlock-title">解锁「{pending.label}」？</h2>
                <p>
                  需要 <strong>{pending.price}</strong> 积分。
                  <span className="unlock-note-long">
                    优先使用奖励积分，不足部分再扣成长积分和本周积分，向日葵可能退回上一阶段。
                  </span>
                  <span className="unlock-note-short">优先扣奖励积分。</span>
                </p>
                <p className="muted">
                  当前可用积分：{points + gift}
                  {gift > 0 ? `（其中奖励 ${gift}，优先使用）` : ''}
                </p>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy}
                    onClick={() => setConfirming(false)}
                  >
                    再想想
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    disabled={busy || points + gift < pending.price}
                    onClick={() => void unlock()}
                  >
                    {points + gift < pending.price
                      ? '积分不够'
                      : busy
                        ? '解锁中…'
                        : `花 ${pending.price} 积分解锁`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
