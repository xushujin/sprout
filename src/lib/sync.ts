import { api, ApiError } from './api';
import { acknowledge, readProgress } from './progress';

export type SyncStatus = 'idle' | 'syncing' | 'pending' | 'login';
const running = new Map<string, Promise<SyncStatus>>();
const retry = new Map<string, { after: number; failures: number }>();

// Called at login, round completion, online, or a deliberate retry. No polling.
// At most 5 rounds per trigger; failures back off for 1–30 minutes.
export async function syncProgress(
  userId: string,
  isCurrentUser: () => boolean,
): Promise<SyncStatus> {
  const active = running.get(userId);
  if (active) return active;
  if (!readProgress(userId).pending.length) return 'idle';
  if (!navigator.onLine || (retry.get(userId)?.after ?? 0) > Date.now()) return 'pending';
  const task = (async (): Promise<SyncStatus> => {
    try {
      for (const event of readProgress(userId).pending.slice(0, 5)) {
        if (!isCurrentUser()) return 'pending';
        // Another tab may have changed the cookie to a different account.
        // The server checks ownership before accepting anything from this queue.
        const result = await api<{ ok: boolean; accepted: boolean }>('/scores', {
          ...event,
          user_id: userId,
        });
        if (result.ok !== true || typeof result.accepted !== 'boolean')
          throw new ApiError(503, '稍后同步');
        await acknowledge(userId, event.id);
      }
      retry.delete(userId);
      return readProgress(userId).pending.length ? 'pending' : 'idle';
    } catch (cause) {
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403))
        return 'login';
      const failures = (retry.get(userId)?.failures ?? 0) + 1;
      retry.set(userId, {
        failures,
        after: Date.now() + Math.min(30, 2 ** (failures - 1)) * 60_000,
      });
      return 'pending';
    }
  })();
  running.set(userId, task);
  try {
    return await task;
  } finally {
    running.delete(userId);
  }
}
