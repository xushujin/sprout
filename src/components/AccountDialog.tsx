import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from '../../shared/types';
import { derivePasswordProof } from '../../shared/password';
import { api } from '../lib/api';
import { Icon } from './Icons';

export function AccountDialog({
  user,
  onClose,
  onChanged,
}: {
  user: User;
  onClose: () => void;
  onChanged: (username: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = String(fields.get('username')).trim();
    const currentPassword = String(fields.get('current_password'));
    if (!username || !currentPassword) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      // The login proof is bound to the username, so derive both the old and the
      // new proof from the same password before asking the server to switch.
      const [current_password_proof, new_password_proof] = await Promise.all([
        derivePasswordProof(user.username, currentPassword),
        derivePasswordProof(username, currentPassword),
      ]);
      const result = await api<{ username: string }>(
        '/me/username',
        { username, current_password_proof, new_password_proof },
        { method: 'PATCH' },
      );
      onChanged(result.username);
      form.reset();
      setMessage('账号名已更新，下次登录请使用新账号名。');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="account-dialog"
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)}>
        <div className="dialog-heading">
          <h2 id="account-title">账号设置</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="muted">当前账号：{user.username}</p>
        <label>
          新账号名
          <input
            name="username"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,31}"
            autoComplete="off"
            placeholder="例如 sprout02"
          />
        </label>
        <label>
          当前密码
          <input
            name="current_password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="current-password"
            placeholder="用于确认是你本人"
          />
        </label>
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
        <p className="local-note">
          修改后学习记录、积分和向日葵都不会丢失；下次登录请使用新账号名。
        </p>
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? '保存中…' : '保存账号名'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
