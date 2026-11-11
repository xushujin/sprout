import { useState, type FormEvent } from 'react';
import type { User } from '../../shared/types';
import { api } from '../lib/api';
import { lastUsername } from '../lib/progress';
import { Icon, SproutArt } from '../components/Icons';
import { derivePasswordProof } from '../../shared/password';

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState(lastUsername);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const password_proof = await derivePasswordProof(username, String(fields.get('password')));
      const result = await api<{ user: User }>('/login', {
        username: username.trim(),
        password_proof,
        rememberMe: remember,
      });
      lastUsername(remember ? result.user.username : '');
      form.reset();
      onLogin(result.user);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-story">
        <a className="brand" href="/">
          <span className="brand-symbol">
            <Icon name="sprout" size={25} />
          </span>
          <span>
            WordSprout<small>单词小芽</small>
          </span>
        </a>
        <div className="login-story-main">
          <span className="eyebrow">A LITTLE WORD. A BIG WORLD.</span>
          <h1>
            小小单词，
            <br />
            长成大大的世界。
          </h1>
          <p>每天 5 个词，让好奇心生根发芽。</p>
          <SproutArt className="login-plant" />
        </div>
        <div className="story-footer">
          <Icon name="leaf" size={18} /> 每一小步，都算数。
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="welcome-icon">☀️</span>
          <h2>你好，小小探索家</h2>
          <p className="muted">登录你的小花园，开始今天的成长。</p>
          <form onSubmit={submit} className="form-stack">
            <label>
              用户名
              <input
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={32}
                placeholder="输入老师给你的用户名"
              />
            </label>
            <label>
              密码
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={128}
                required
                placeholder="输入你的密码"
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              记住我，下次直接进入<span className="tiny">30 天</span>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? '正在打开小花园…' : '进入我的花园'}
              <Icon name="arrow" size={20} />
            </button>
          </form>
          <div className="login-help">
            <Icon name="shield" size={18} />
            <span>
              账号由老师创建，忘记密码请联系老师。
              <br />
              公用设备上请取消勾选“记住我”。
            </span>
          </div>
          <p className="tiny admin-note">老师也从这里登录 · 管理员登录最多保留 2 小时</p>
        </div>
        <p className="login-bottom">慢慢来，你正在长大 🌱</p>
      </section>
    </main>
  );
}
