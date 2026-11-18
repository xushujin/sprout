import { useEffect, useState, type FormEvent } from 'react';
import type { Student } from '../../shared/types';
import { api } from '../lib/api';
import { Icon } from '../components/Icons';
import { derivePasswordProof } from '../../shared/password';

interface StudentPage {
  students: Student[];
  next_cursor: string | null;
}
export function Admin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [usernameId, setUsernameId] = useState<string | null>(null);
  async function load(next?: string) {
    setBusy(true);
    setError('');
    try {
      const result = await api<StudentPage>(
        `/admin/students${next ? `?cursor=${encodeURIComponent(next)}` : ''}`,
      );
      setStudents((old) => (next ? [...old, ...result.students] : result.students));
      setCursor(result.next_cursor);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const username = String(fields.get('username'));
      const password_proof = await derivePasswordProof(username, String(fields.get('password')));
      await api('/admin/students', {
        username,
        display_name: fields.get('display_name'),
        password_proof,
      });
      form.reset();
      setMessage('学生账号已创建，请将初始密码交给学生。');
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function rename(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const display_name = String(new FormData(form).get('display_name')).trim();
      const result = await api<{ display_name: string }>(
        `/admin/students/${id}`,
        { display_name },
        { method: 'PATCH' },
      );
      setStudents((items) =>
        items.map((student) =>
          student.id === id ? { ...student, display_name: result.display_name } : student,
        ),
      );
      setRenameId(null);
      setMessage('昵称已更新，学生刷新页面后即可看到；排行榜将在下次自动刷新后更新。');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changeUsername(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = String(fields.get('username')).trim();
    const password = String(fields.get('password'));
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const password_proof = await derivePasswordProof(username, password);
      const result = await api<{ username: string }>(
        `/admin/students/${id}/username`,
        { username, password_proof },
        { method: 'PATCH' },
      );
      setStudents((items) =>
        items.map((student) =>
          student.id === id ? { ...student, username: result.username } : student,
        ),
      );
      setUsernameId(null);
      setMessage('登录账号已更新，学生旧会话已撤销；请用新账号和新密码告知学生。');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reset(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const student = students.find((item) => item.id === id)!;
      const password_proof = await derivePasswordProof(
        student.username,
        String(new FormData(form).get('password')),
      );
      await api(`/admin/students/${id}/password`, { password_proof });
      form.reset();
      setResetId(null);
      setMessage('密码已重置，学生需要重新登录。');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TEACHER'S CORNER</span>
          <h1>照顾每一颗小芽</h1>
          <p>管理学生账号，看看每颗小芽的累计成长。</p>
        </div>
        <span className="pill pale">
          <Icon name="shield" size={16} /> 管理员
        </span>
      </div>
      <section className="admin-create">
        <h2>创建学生账号</h2>
        <p className="muted">公开昵称请用“小橘子”等别名，不要填写真实姓名。</p>
        <form className="admin-form" onSubmit={create}>
          <label>
            用户名
            <input
              name="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,31}"
              autoComplete="off"
              placeholder="例如 sprout01"
            />
          </label>
          <label>
            公开昵称
            <input name="display_name" required maxLength={20} placeholder="例如 小橘子" />
          </label>
          <label>
            初始密码
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="至少 8 个字符"
            />
          </label>
          <button className="button primary" disabled={busy}>
            创建账号
            <Icon name="arrow" size={18} />
          </button>
        </form>
      </section>
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
      <section className="admin-list">
        <div className="section-heading">
          <h2>学生与学习数据</h2>
          <button className="button text-button" disabled={busy} onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            刷新
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>学生</th>
                <th>完成轮次</th>
                <th>新学 / 复习</th>
                <th>正确率</th>
                <th>积分</th>
                <th>账号管理</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    {renameId === s.id ? (
                      <form className="reset-form" onSubmit={(event) => void rename(event, s.id)}>
                        <input
                          name="display_name"
                          aria-label={`为${s.display_name}设置新昵称`}
                          defaultValue={s.display_name}
                          required
                          minLength={1}
                          maxLength={20}
                          autoComplete="off"
                        />
                        <button className="button small primary" disabled={busy}>
                          保存昵称
                        </button>
                        <button
                          className="button small secondary"
                          type="button"
                          onClick={() => setRenameId(null)}
                        >
                          取消
                        </button>
                        <small>{s.username}</small>
                      </form>
                    ) : (
                      <>
                        <strong>{s.display_name}</strong>
                        <small>{s.username}</small>
                      </>
                    )}
                  </td>
                  <td>
                    {s.rounds}
                    <small className="cell-note">本周 {s.week_rounds} 轮</small>
                  </td>
                  <td>
                    {s.words_learned} / {s.words_reviewed}
                  </td>
                  <td>
                    {s.total_count
                      ? `${Math.round((s.correct_count / s.total_count) * 100)}%`
                      : '—'}
                  </td>
                  <td className="points-cell">
                    {s.points}
                    <small className="cell-note">本周 +{s.week_points}</small>
                  </td>
                  <td>
                    {renameId === s.id ? (
                      <span className="muted">正在修改昵称</span>
                    ) : usernameId === s.id ? (
                      <form className="reset-form" onSubmit={(e) => void changeUsername(e, s.id)}>
                        <input
                          name="username"
                          aria-label={`为${s.display_name}设置新登录账号`}
                          defaultValue={s.username}
                          required
                          minLength={3}
                          maxLength={32}
                          pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,31}"
                          autoComplete="off"
                          placeholder="新登录账号"
                        />
                        <input
                          name="password"
                          aria-label={`为${s.display_name}设置新密码`}
                          type="password"
                          required
                          minLength={8}
                          maxLength={128}
                          autoComplete="new-password"
                          placeholder="新密码，至少 8 位"
                        />
                        <button className="button small primary" disabled={busy}>
                          保存账号
                        </button>
                        <button
                          className="button small secondary"
                          type="button"
                          onClick={() => setUsernameId(null)}
                        >
                          取消
                        </button>
                      </form>
                    ) : resetId === s.id ? (
                      <form className="reset-form" onSubmit={(e) => void reset(e, s.id)}>
                        <input
                          name="password"
                          aria-label={`为${s.display_name}设置新密码`}
                          type="password"
                          required
                          minLength={8}
                          maxLength={128}
                          autoComplete="new-password"
                          placeholder="新密码，至少 8 位"
                        />
                        <button className="button small primary" disabled={busy}>
                          确认重置
                        </button>
                        <button
                          className="button small secondary"
                          type="button"
                          onClick={() => setResetId(null)}
                        >
                          取消
                        </button>
                      </form>
                    ) : (
                      <div className="row-actions">
                        <button
                          className="button small secondary"
                          onClick={() => {
                            setUsernameId(s.id);
                            setRenameId(null);
                            setResetId(null);
                            setError('');
                            setMessage('');
                          }}
                        >
                          修改账号
                        </button>
                        <button
                          className="button small secondary"
                          onClick={() => {
                            setRenameId(s.id);
                            setUsernameId(null);
                            setResetId(null);
                            setError('');
                            setMessage('');
                          }}
                        >
                          修改昵称
                        </button>
                        <button
                          className="button small secondary"
                          onClick={() => {
                            setResetId(s.id);
                            setUsernameId(null);
                            setRenameId(null);
                            setError('');
                            setMessage('');
                          }}
                        >
                          重置密码
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!students.length && (
          <p className="empty-state">
            {busy ? '正在加载学生…' : '还没有学生，先为第一颗小芽创建账号吧。'}
          </p>
        )}
        {cursor && (
          <button
            className="button secondary load-more"
            disabled={busy}
            onClick={() => void load(cursor)}
          >
            加载更多学生
          </button>
        )}
        <p className="local-note">
          完成轮次、新学 / 复习、正确率均为累计值；积分为当前成长积分，本周 +Y
          为本周学习获得。本周数据在周一 00:00
          清零，单独标注。新学词数为学习事件计数，跨设备可能重复；昵称修改后，排行榜在下次 30
          分钟快照刷新。
        </p>
      </section>
    </div>
  );
}
