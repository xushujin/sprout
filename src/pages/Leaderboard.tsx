import { useEffect, useRef, useState } from 'react';
import type { Leaderboard as Snapshot } from '../../shared/types';
import { api } from '../lib/api';
import { growthFor } from '../lib/growth';
import { Icon } from '../components/Icons';
import { Sunflower } from '../components/Sunflower';
import { UserAvatar } from '../components/UserAvatar';

type Range = 'week' | 'all';
type Entry = Snapshot['entries'][number];
type Selected = { entry: Entry; rank: number };

export function Leaderboard() {
  const [range, setRange] = useState<Range>('week');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  async function load(next: Range = range) {
    setRange(next);
    setBusy(true);
    setFailed(false);
    setSnapshot(null);
    setSelected(null);
    try {
      setSnapshot(await api<Snapshot>(`/leaderboard?range=${next}`));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load('week');
  }, []);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (selected && !el.open) el.showModal();
    if (!selected && el.open) el.close();
  }, [selected]);

  const weekly = range === 'week';
  const stage = selected ? growthFor(selected.entry.lifetime_points ?? 0) : null;

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GROWING TOGETHER</span>
          <h1>一起发芽，一起长大</h1>
          <p>每一次认真练习，都在闪闪发光。</p>
        </div>
        <span className="page-emblem">🏆</span>
      </div>
      <section className="leaderboard-card">
        <div className="leaderboard-heading">
          <div>
            <div className="leaderboard-tabs" role="tablist" aria-label="排行榜范围">
              <button
                type="button"
                role="tab"
                aria-selected={weekly}
                className={weekly ? 'active' : ''}
                onClick={() => void load('week')}
              >
                本周星榜
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!weekly}
                className={!weekly ? 'active' : ''}
                onClick={() => void load('all')}
              >
                总排行榜
              </button>
            </div>
            <p className="muted">
              {weekly
                ? '周一开启新一周 · 每 30 分钟更新 · 点一点看看大家的形象'
                : '从第一天到现在的累计成长 · 每 30 分钟更新 · 点一点看看大家的形象'}
            </p>
          </div>
          <button
            className="icon-button"
            onClick={() => void load(range)}
            disabled={busy}
            aria-label="刷新排行榜"
          >
            <Icon name="refresh" />
          </button>
        </div>
        {failed && <div className="notice">榜单稍后更新，先去种下更多单词吧。</div>}
        {busy && !snapshot ? (
          <p className="empty-state">正在收集大家的小小成长…</p>
        ) : !snapshot?.entries.length ? (
          <div className="empty-state">
            <span>🌱</span>
            <h3>{weekly ? '本周的小芽正在努力成长' : '总榜还在等第一颗小芽'}</h3>
            <p>
              {weekly
                ? '完成学习后，等下一次更新就能看到积分啦。'
                : '完成第一轮学习，累计成长就会出现在这里。'}
            </p>
          </div>
        ) : (
          <ol className="ranking-list">
            {snapshot.entries.map((entry, i) => {
              const growth = growthFor(entry.lifetime_points ?? 0);
              return (
                <li key={`${entry.display_name}-${i}`}>
                  <button
                    type="button"
                    className="rank-row"
                    onClick={() => setSelected({ entry, rank: i + 1 })}
                    aria-label={`查看${entry.display_name}的形象，第 ${i + 1} 名`}
                    title="看看形象"
                  >
                    <span className={`rank-number rank-${i}`}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="rank-avatar">
                      {entry.avatar ? (
                        <>
                          <UserAvatar avatar={entry.avatar} size={48} className="rank-avatar-img" />
                          <span className="rank-stage" aria-hidden="true">
                            <Sunflower
                              variant="badge"
                              stage={growth.index}
                              className="sunflower-rank-stage"
                            />
                          </span>
                        </>
                      ) : (
                        <Sunflower
                          variant="badge"
                          stage={growth.index}
                          className="sunflower-rank"
                        />
                      )}
                    </span>
                    <div className="rank-person">
                      <strong>{entry.display_name}</strong>
                      <span>完成 {entry.rounds} 轮学习</span>
                    </div>
                    <strong className="rank-points">
                      {entry.points}
                      <small> {weekly ? '本周积分' : '成长积分'}</small>
                    </strong>
                    <span className="rank-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {snapshot?.generated_at && (
          <p className="snapshot-time">
            最近更新：
            {new Date(snapshot.generated_at).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            （北京时间）
          </p>
        )}
      </section>
      <div className="garden-tip">
        <Icon name="leaf" />
        <p>
          <strong>成长有自己的速度</strong>比起名次，更棒的是今天的你又多认识了一个单词。
        </p>
      </div>

      <dialog
        ref={dialog}
        className="rank-dialog"
        aria-labelledby="rank-dialog-title"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setSelected(null);
        }}
      >
        {selected && stage && (
          <div className="rank-dialog-body">
            <button
              type="button"
              className="rank-dialog-close"
              onClick={() => setSelected(null)}
              aria-label="关闭"
            >
              ×
            </button>
            <span className="eyebrow">A LITTLE EXPLORER</span>
            <div className="rank-dialog-stage">
              {selected.entry.avatar ? (
                <UserAvatar avatar={selected.entry.avatar} size={170} variant="full" />
              ) : (
                <div className="rank-dialog-empty">
                  <span aria-hidden="true">🌱</span>
                  <small>形象将在下次榜单更新后显示</small>
                </div>
              )}
            </div>
            <h2 id="rank-dialog-title">{selected.entry.display_name}</h2>
            <p className="rank-dialog-meta">
              第 {selected.rank} 名 · 完成 {selected.entry.rounds} 轮学习
            </p>
            <div className="rank-dialog-stats">
              <div>
                <strong>{selected.entry.points}</strong>
                <span>{weekly ? '本周积分' : '成长积分'}</span>
              </div>
              <div>
                <strong>{stage.stage.name}</strong>
                <span>向日葵阶段</span>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
