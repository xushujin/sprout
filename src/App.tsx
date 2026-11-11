import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '../shared/types';
import { api } from './lib/api';
import { emptyProgress, lastUsername, readProgress, storageIsDurable } from './lib/progress';
import { syncProgress, type SyncStatus } from './lib/sync';
import { Icon } from './components/Icons';
import { Login } from './pages/Login';
import { Learn } from './pages/Learn';
import { Leaderboard } from './pages/Leaderboard';
import { Admin } from './pages/Admin';

type Page = 'learn' | 'leaderboard' | 'admin';
function pageFromPath(): Page {
  return location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname === '/leaderboard' || location.pathname === '/leaderboard/'
      ? 'leaderboard'
      : 'learn';
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState(false);
  const [page, setPage] = useState<Page>(pageFromPath);
  const [progress, setProgress] = useState(emptyProgress);
  const [sync, setSync] = useState<SyncStatus>('idle');
  const [activeRound, setActiveRound] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [message, setMessage] = useState('');
  const progressRef = useRef(progress);
  progressRef.current = progress;

  function navigate(next: Page) {
    setPage(next);
    history.replaceState(null, '', next === 'learn' ? '/' : `/${next}`);
  }
  const refreshProgress = useCallback(() => {
    if (userRef.current?.role === 'student') setProgress(readProgress(userRef.current.id));
  }, []);
  const syncNow = useCallback(async () => {
    const current = userRef.current;
    if (!current || current.role !== 'student') return;
    setSync('syncing');
    const result = await syncProgress(current.id, () => userRef.current?.id === current.id);
    if (userRef.current?.id === current.id) {
      setSync(result);
      refreshProgress();
    }
  }, [refreshProgress]);

  function signedIn(next: User, auto = false) {
    userRef.current = next;
    setUser(next);
    setMessage('');
    setBootError(false);
    if (next.role === 'student') {
      setProgress(readProgress(next.id));
      if (page === 'admin' || !auto) navigate('learn');
      void syncNow();
    } else navigate('admin');
  }
  useEffect(() => {
    // Only the server can restore identity. No password, token or user profile is
    // saved in localStorage; learning records are isolated by the returned ID.
    void api<{ user: User }>('/me')
      .then(({ user: next }) => signedIn(next, true))
      .catch((cause) => {
        if (cause.status !== 401) setBootError(true);
      })
      .finally(() => setBooting(false));
    const online = () => {
      void syncNow();
    };
    window.addEventListener('online', online);
    window.addEventListener('storage', refreshProgress);
    window.addEventListener('wordsprout:progress', refreshProgress);
    const leave = (event: BeforeUnloadEvent) => {
      if (!storageIsDurable() && progressRef.current.pending.length) event.preventDefault();
    };
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('storage', refreshProgress);
      window.removeEventListener('wordsprout:progress', refreshProgress);
      window.removeEventListener('beforeunload', leave);
    };
  }, [syncNow, refreshProgress]);

  async function logout() {
    setLogoutBusy(true);
    setMessage('');
    try {
      await api('/logout', {});
      lastUsername('');
      userRef.current = null;
      setUser(null);
      setProgress(emptyProgress());
      setSync('idle');
      navigate('learn');
    } catch {
      setMessage('暂时无法退出，请联网后重试，以便清除服务端会话。');
    } finally {
      setLogoutBusy(false);
    }
  }

  if (booting)
    return (
      <div className="boot-screen">
        <img src="/sprout.svg" width="64" height="64" alt="" />
        <h1>WordSprout</h1>
        <p>正在打开你的小花园…</p>
      </div>
    );
  if (!user)
    return (
      <>
        {bootError && (
          <div className="boot-notice">
            暂时无法恢复登录，请连接网络后重试。学习记录仍保存在本机。
          </div>
        )}
        <Login onLogin={signedIn} />
      </>
    );

  const nav = [
    { id: 'learn' as const, label: '我的花园', icon: 'sprout' as const },
    { id: 'leaderboard' as const, label: '成长星榜', icon: 'cup' as const },
  ];
  const items =
    user.role === 'admin'
      ? [{ id: 'admin' as const, label: '老师的花园', icon: 'shield' as const }, nav[1]]
      : nav;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href={user.role === 'admin' ? '/admin' : '/'} className="brand">
          <span className="brand-symbol">
            <Icon name="sprout" size={25} />
          </span>
          <span>
            WordSprout<small>单词小芽</small>
          </span>
        </a>
        <div className="nav-label">让成长，悄悄发生</div>
        <nav className="side-nav" aria-label="主导航">
          {items.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
              disabled={activeRound}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
              {page === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>🌿</span>
            <p>
              不用一下子很厉害，
              <br />
              每天进步一点点。
            </p>
          </div>
          <div className="profile">
            <span className="profile-avatar">{user.role === 'admin' ? '🌻' : '🌱'}</span>
            <div>
              <strong>{user.display_name}</strong>
              <span>{user.role === 'admin' ? '小芽管理员' : '小小探索家'}</span>
            </div>
            <button
              className="icon-button"
              onClick={() => void logout()}
              disabled={logoutBusy || activeRound || sync === 'syncing'}
              aria-label="退出登录"
            >
              <Icon name="logout" size={19} />
            </button>
          </div>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <span>
            {user.role === 'admin' ? '每颗小芽，都值得被看见。' : 'HELLO, LITTLE EXPLORER'}
          </span>
          <span className="topbar-right">
            <Icon name="leaf" size={17} />
            一点一滴，向上生长
          </span>
        </header>
        <main className="main-content">
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          {user.role === 'student' && (
            <div
              className={`sync-status ${progress.pending.length ? 'has-pending' : ''}`}
              role="status"
            >
              <Icon name="cloud" size={16} />
              <span>
                {!storageIsDurable()
                  ? '浏览器无法保存，请勿关闭页面；联网后同步。'
                  : sync === 'login'
                    ? '本轮已保存在本机，请重新登录后同步。'
                    : sync === 'syncing'
                      ? '正在同步小小成长…'
                      : progress.pending.length
                        ? `已在本机保存 ${progress.pending.length} 轮，稍后同步`
                        : '学习进度保存在本机，积分已同步'}
              </span>
              {sync === 'login' ? (
                <button
                  onClick={() => {
                    userRef.current = null;
                    setUser(null);
                  }}
                >
                  重新登录
                </button>
              ) : (
                progress.pending.length > 0 && (
                  <button disabled={sync === 'syncing'} onClick={() => void syncNow()}>
                    重试同步
                  </button>
                )
              )}
            </div>
          )}
          {page === 'learn' && user.role === 'student' && (
            <Learn
              user={user}
              progress={progress}
              roundActive={setActiveRound}
              onComplete={() => {
                refreshProgress();
                void syncNow();
              }}
            />
          )}
          {page === 'leaderboard' && <Leaderboard />}
          {page === 'admin' && user.role === 'admin' && <Admin />}
          {activeRound && <p className="local-note">完成这一轮后会保存结果，并可切换页面。</p>}
        </main>
        <footer className="app-footer">
          <Icon name="sprout" size={16} /> WordSprout <span>·</span> 每天一小步，英语一大步。
          <a href="/audio-credits.html" target="_blank" rel="noreferrer">
            发音来源
          </a>
        </footer>
      </div>
    </div>
  );
}
