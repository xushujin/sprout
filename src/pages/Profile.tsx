import { useState } from 'react';
import type { User } from '../../shared/types';
import {
  DEFAULT_AVATAR,
  FACE_OPTIONS,
  GENDERS,
  HAIR_OPTIONS,
  OUTFIT_OPTIONS,
  SHOP_ITEMS,
  SKIN_OPTIONS,
  type AvatarConfig,
  type Gender,
  type ShopItem,
} from '../../shared/avatar';
import { api } from '../lib/api';
import { UserAvatar } from '../components/UserAvatar';

const SHOP_ICONS: Record<string, string> = {
  straw_hat: '👒',
  glasses: '👓',
  scarf: '🧣',
  crown: '👑',
  stars: '✨',
  brooch: '🌻',
};

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
  const [owned, setOwned] = useState(user.owned_items ?? []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const firstTime = !user.avatar;

  function change(patch: Partial<AvatarConfig>) {
    setAvatar((current) => ({ ...current, ...patch }));
    setDirty(true);
    setMessage('');
  }

  function changeGender(gender: Gender) {
    const hair = HAIR_OPTIONS[gender].some((item) => item.id === avatar.hair)
      ? avatar.hair
      : HAIR_OPTIONS[gender][0].id;
    change({ gender, hair });
  }

  async function persist(next: AvatarConfig, extra: Partial<User> = {}, note = '') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ avatar: AvatarConfig }>(
        '/me/avatar',
        { avatar: next },
        { method: 'PATCH' },
      );
      setAvatar(result.avatar);
      setDirty(false);
      onUserChange({ ...user, ...extra, avatar: result.avatar });
      if (note) setMessage(note);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function buy(item: ShopItem) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ points: number; owned_items: string[] }>(
        '/shop/purchase',
        { item_id: item.id },
        { method: 'POST' },
      );
      const next = { ...avatar, items: { ...avatar.items, [item.slot]: item.id } };
      setPoints(result.points);
      setOwned(result.owned_items);
      setAvatar(next);
      setConfirmItem(null);
      onSpend(item.price);
      await persist(
        next,
        { points: result.points, owned_items: result.owned_items },
        `已购买「${item.name}」并戴上。`,
      );
    } catch (cause) {
      setError((cause as Error).message);
      setConfirmItem(null);
    } finally {
      setBusy(false);
    }
  }

  function toggleItem(item: ShopItem) {
    const items = { ...avatar.items };
    if (items[item.slot] === item.id) delete items[item.slot];
    else items[item.slot] = item.id;
    const next = { ...avatar, items };
    setAvatar(next);
    void persist(
      next,
      {},
      items[item.slot] ? `已戴上「${item.name}」。` : `已取下「${item.name}」。`,
    );
  }

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MY LITTLE AVATAR</span>
          <h1>{firstTime ? '先给自己选个形象' : '我的形象'}</h1>
          <p>
            {firstTime
              ? '男孩或女孩、发型、肤色和衣服，都可以慢慢换。'
              : '换形象免费；买装饰会扣积分，向日葵和排名也会受影响。'}
          </p>
        </div>
        <span className="page-emblem">🌱</span>
      </div>

      <div className="avatar-layout">
        <section className="avatar-preview-card">
          <div className="avatar-stage">
            <UserAvatar avatar={avatar} size={190} />
          </div>
          <h2>{user.display_name}</h2>
          <p className="avatar-points">
            可用积分 <strong>{points}</strong>
          </p>
          <p className="muted">
            买装饰会从积分里扣。积分减少后，向日葵可能退回上一阶段，本周星榜排名也会下降。
          </p>
        </section>

        <section className="avatar-editor">
          <h2>基础形象</h2>
          <div className="avatar-group">
            <span className="avatar-label">性别</span>
            <div className="avatar-options">
              {GENDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={avatar.gender === item.id ? 'active' : ''}
                  onClick={() => changeGender(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="avatar-group">
            <span className="avatar-label">发型</span>
            <div className="avatar-options">
              {HAIR_OPTIONS[avatar.gender].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={avatar.hair === item.id ? 'active' : ''}
                  onClick={() => change({ hair: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="avatar-group">
            <span className="avatar-label">脸型</span>
            <div className="avatar-options">
              {FACE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={avatar.face === item.id ? 'active' : ''}
                  onClick={() => change({ face: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="avatar-group">
            <span className="avatar-label">肤色</span>
            <div className="avatar-options">
              {SKIN_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`skin-swatch ${avatar.skin === item.id ? 'active' : ''}`}
                  style={{ background: item.color }}
                  onClick={() => change({ skin: item.id })}
                  aria-label={item.label}
                />
              ))}
            </div>
          </div>
          <div className="avatar-group">
            <span className="avatar-label">基础服饰</span>
            <div className="avatar-options">
              {OUTFIT_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={avatar.outfit === item.id ? 'active' : ''}
                  onClick={() => change({ outfit: item.id })}
                >
                  <span className="outfit-dot" style={{ background: item.color }} />
                  {item.label}
                </button>
              ))}
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
          <div className="avatar-actions">
            <button
              className="button primary"
              disabled={!dirty || busy}
              onClick={() => void persist(avatar)}
            >
              {busy ? '保存中…' : '保存形象'}
            </button>
            {dirty && <span className="muted">有未保存的修改</span>}
          </div>
        </section>
      </div>

      {!firstTime && (
        <section className="avatar-shop">
          <div className="section-heading">
            <h2>装饰商店</h2>
            <span className="muted">
              已拥有 {owned.length} / {SHOP_ITEMS.length}
            </span>
          </div>
          <div className="shop-grid">
            {SHOP_ITEMS.map((item) => {
              const isOwned = owned.includes(item.id);
              const equipped = avatar.items[item.slot] === item.id;
              return (
                <article key={item.id} className={`shop-card ${equipped ? 'equipped' : ''}`}>
                  <span className="shop-icon" aria-hidden="true">
                    {SHOP_ICONS[item.id]}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>
                  {equipped ? (
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={busy}
                      onClick={() => toggleItem(item)}
                    >
                      取下
                    </button>
                  ) : isOwned ? (
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={busy}
                      onClick={() => toggleItem(item)}
                    >
                      戴上
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button small primary"
                      disabled={busy}
                      onClick={() => setConfirmItem(item)}
                    >
                      {item.price} 积分
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {confirmItem && (
        <div
          className="purchase-overlay"
          role="presentation"
          onClick={() => {
            if (!busy) setConfirmItem(null);
          }}
        >
          <div
            className="purchase-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="purchase-title">买下「{confirmItem.name}」？</h2>
            <p>
              会扣 <strong>{confirmItem.price}</strong> 积分。积分减少后，向日葵可能退回上一阶段，
              本周星榜排名也会下降。
            </p>
            <p className="muted">当前可用积分：{points}</p>
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setConfirmItem(null)}
              >
                再想想
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || points < confirmItem.price}
                onClick={() => void buy(confirmItem)}
              >
                {points < confirmItem.price
                  ? '积分不够'
                  : busy
                    ? '购买中…'
                    : `确认花 ${confirmItem.price} 积分`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
