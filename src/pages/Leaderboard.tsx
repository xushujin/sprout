import { useEffect, useState } from 'react';
import type { Leaderboard as Snapshot } from '../../shared/types';
import { api } from '../lib/api';
import { growthFor } from '../lib/growth';
import { Icon } from '../components/Icons';
import { Sunflower } from '../components/Sunflower';

export function Leaderboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  async function load() {
    setBusy(true);
    setFailed(false);
    try {
      setSnapshot(await api<Snapshot>('/leaderboard'));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
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
            <h2>
              <Icon name="cup" /> 本周成长星榜
            </h2>
            <p className="muted">周一开启新一周 · 每 30 分钟更新 · 仅展示昵称</p>
          </div>
          <button
            className="icon-button"
            onClick={() => void load()}
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
            <h3>小芽们正在努力成长</h3>
            <p>完成学习后，等下一次更新就能看到积分啦。</p>
          </div>
        ) : (
          <ol className="ranking-list">
            {snapshot.entries.map((entry, i) => (
              <li key={`${entry.display_name}-${i}`}>
                <span className={`rank-number rank-${i}`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : String(i + 1).padStart(2, '0')}
                </span>
                <span className="rank-avatar">
                  <Sunflower
                    variant="badge"
                    stage={growthFor(entry.lifetime_points ?? 0).index}
                    className="sunflower-rank"
                  />
                </span>
                <div className="rank-person">
                  <strong>{entry.display_name}</strong>
                  <span>完成 {entry.rounds} 轮学习</span>
                </div>
                <strong className="rank-points">
                  {entry.points}
                  <small> 积分</small>
                </strong>
              </li>
            ))}
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
    </div>
  );
}
