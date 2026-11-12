import { env as bindings } from 'cloudflare:workers';
import {
  createExecutionContext,
  createScheduledController,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../../worker/index';
import type { Env } from '../../worker/env';
import type { Student, User } from '../../shared/types';
import { hashPassword, hashToken, verifyPassword } from '../../shared/crypto';
import { schoolWeek } from '../../shared/time';

const env = {
  ...bindings,
  LOGIN_LIMITER: undefined,
  WRITE_LIMITER: undefined,
} as unknown as Env & { TEST_SCHEMA: string };
const adminId = '00000000-0000-4000-8000-000000000001';
const studentId = '00000000-0000-4000-8000-000000000002';
// Synthetic client-derived credentials keep slow browser stretching out of
// workerd. The real browser-to-Node compatibility is covered by Playwright.
const password = 'a1'.repeat(32);
const newPassword = 'b2'.repeat(32);
let passwordHash: string;

async function request(
  path: string,
  data?: unknown,
  cookie?: string,
  overrides?: Partial<Env>,
  method?: 'GET' | 'POST' | 'PATCH',
) {
  return worker.fetch(
    new Request(`${env.APP_ORIGIN}/api${path}`, {
      method: method ?? (data === undefined ? 'GET' : 'POST'),
      headers: {
        Origin: env.APP_ORIGIN,
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
    { ...env, ...overrides },
  );
}
async function login(username = 'student01', rememberMe = true) {
  const response = await request('/login', { username, password_proof: password, rememberMe });
  expect(response.status).toBe(200);
  const cookie = response.headers.get('Set-Cookie')!;
  return {
    response,
    cookie: cookie.split(';')[0],
    fullCookie: cookie,
    data: (await response.json()) as { user: User },
  };
}
const score = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  user_id: studentId,
  words_learned: 3,
  words_reviewed: 2,
  correct_count: 4,
  total_count: 5,
  mistakes_corrected: 1,
  points_earned: 45,
  ...overrides,
});

beforeAll(async () => {
  await env.DB.batch(
    env.TEST_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => env.DB.prepare(s)),
  );
  passwordHash = await hashPassword(password, env.PASSWORD_PEPPER);
});
beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM score_events'),
    env.DB.prepare('DELETE FROM sessions'),
    env.DB.prepare('DELETE FROM users'),
    env.DB.prepare(
      'INSERT INTO users(id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(adminId, 'admin', passwordHash, '老师', 'admin', 1),
    env.DB.prepare(
      'INSERT INTO users(id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(studentId, 'student01', passwordHash, '小橘子', 'student', 1),
  ]);
  await env.LEADERBOARD.delete(`leaderboard:${schoolWeek().key}`);
});

describe('sessions and access control', () => {
  it('uses salted PBKDF2 and requires the correct password and pepper', async () => {
    const second = await hashPassword(password, env.PASSWORD_PEPPER);
    expect(second).not.toBe(passwordHash);
    expect(await verifyPassword(password, passwordHash, env.PASSWORD_PEPPER)).toBe(true);
    expect(await verifyPassword('wrong', passwordHash, env.PASSWORD_PEPPER)).toBe(false);
    expect(await verifyPassword(password, passwordHash, 'different-pepper')).toBe(false);
  });

  it('issues a 30-day secure HttpOnly cookie, hashes the token and restores identity without renewing', async () => {
    const auth = await login();
    expect(auth.fullCookie).toContain('Max-Age=2592000');
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/'])
      expect(auth.fullCookie).toContain(flag);
    expect(auth.fullCookie).toMatch(/^__Host-ws_session=/);
    expect(auth.data.user).not.toHaveProperty('password_hash');
    const stored = await env.DB.prepare('SELECT * FROM sessions').first<{
      token_hash: string;
      expires_at: number;
    }>();
    expect(stored!.token_hash).toBe(await hashToken(auth.cookie.split('=')[1]));
    expect(stored!.expires_at).toBeGreaterThan(Date.now() / 1000 + 29 * 86400);
    const me = await request('/me', undefined, auth.cookie);
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ user: auth.data.user });
    expect(me.headers.get('Set-Cookie')).toBeNull();
    expect(await env.DB.prepare('SELECT * FROM sessions').first()).toEqual(stored);
  });

  it('omits persistence for unchecked remember-me and caps admins at two hours', async () => {
    const student = await login('student01', false);
    expect(student.fullCookie).not.toMatch(/Max-Age|Expires/i);
    const admin = await login('admin', true);
    expect(admin.fullCookie).toContain('Max-Age=7200');
    expect(admin.fullCookie).not.toContain('2592000');
  });

  it('expires sessions, revokes the previous login, and deletes a logged-out session', async () => {
    const first = await login();
    const second = await login();
    expect((await request('/me', undefined, first.cookie)).status).toBe(401);
    expect(
      (await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions').first<{ n: number }>())!.n,
    ).toBe(1);
    const logout = await request('/logout', {}, second.cookie);
    expect(logout.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect((await request('/me', undefined, second.cookie)).status).toBe(401);
    const third = await login();
    await env.DB.prepare('UPDATE sessions SET expires_at = 0').run();
    expect((await request('/me', undefined, third.cookie)).status).toBe(401);
  });

  it('rejects cross-site writes, missing Origin, malformed JSON and wrong passwords', async () => {
    for (const origin of ['https://evil.example', 'null', '']) {
      const response = await worker.fetch(
        new Request(`${env.APP_ORIGIN}/api/login`, {
          method: 'POST',
          headers: origin ? { Origin: origin } : {},
          body: '{}',
        }),
        env,
      );
      expect(response.status).toBe(403);
    }
    const malformed = await worker.fetch(
      new Request(`${env.APP_ORIGIN}/api/login`, {
        method: 'POST',
        headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' },
        body: '[',
      }),
      env,
    );
    expect(malformed.status).toBe(400);
    expect(
      (await request('/login', { username: 'student01', password_proof: newPassword })).status,
    ).toBe(401);
    expect(
      (await request('/login', { username: "' OR 1=1--", password_proof: password })).status,
    ).toBe(401);
    expect(
      (await request('/login', { username: 'missing', password_proof: password })).status,
    ).toBe(401);
  });

  it('rejects excessive login attempts before querying D1', async () => {
    const response = await request(
      '/login',
      { username: 'student01', password_proof: password },
      undefined,
      {
        LOGIN_LIMITER: { limit: async () => ({ success: false }) } as RateLimit,
        DB: {
          prepare: () => {
            throw new Error('must not query');
          },
        } as unknown as D1Database,
      },
    );
    expect(response.status).toBe(429);
  });

  it('enforces administrator role on every management operation', async () => {
    const auth = await login();
    for (const [path, data] of [
      ['/admin/students', undefined],
      ['/admin/students', { username: 'new', password_proof: password, display_name: '小芽' }],
      [`/admin/students/${studentId}/password`, { password_proof: newPassword }],
    ] as const)
      expect((await request(path, data, auth.cookie)).status).toBe(403);
    expect(
      (
        await request(
          `/admin/students/${studentId}`,
          { display_name: '新昵称' },
          auth.cookie,
          undefined,
          'PATCH',
        )
      ).status,
    ).toBe(403);
    expect((await request('/admin/students')).status).toBe(401);
  });

  it('lets only an administrator rename students and reflects it in their session', async () => {
    const student = await login();
    const admin = await login('admin');
    const path = `/admin/students/${studentId}`;
    const renamed = await request(
      path,
      { display_name: '  小太阳  ' },
      admin.cookie,
      undefined,
      'PATCH',
    );
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toEqual({ ok: true, display_name: '小太阳' });
    const me = await request('/me', undefined, student.cookie);
    expect(((await me.json()) as { user: User }).user.display_name).toBe('小太阳');
    const report = (await (await request('/admin/students', undefined, admin.cookie)).json()) as {
      students: Student[];
    };
    expect(report.students[0].display_name).toBe('小太阳');
    expect(
      (await request(path, { display_name: '' }, admin.cookie, undefined, 'PATCH')).status,
    ).toBe(422);
    expect(
      (
        await request(
          `/admin/students/${adminId}`,
          { display_name: '不能改管理员' },
          admin.cookie,
          undefined,
          'PATCH',
        )
      ).status,
    ).toBe(404);
    expect(
      (await request(path, { display_name: '未登录' }, undefined, undefined, 'PATCH')).status,
    ).toBe(401);
  });

  it('creates only students, rejects duplicates, and resets passwords with atomic session revocation', async () => {
    const admin = await login('admin');
    const input = {
      username: 'new-student',
      password_proof: password,
      display_name: '小葡萄',
      role: 'admin',
    };
    expect((await request('/admin/students', input, admin.cookie)).status).toBe(201);
    expect((await request('/admin/students', input, admin.cookie)).status).toBe(409);
    const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
      .bind(input.username)
      .first<User & { password_hash: string }>();
    expect(row!.role).toBe('student');
    expect(row!.password_hash).not.toBe(password);
    const student = await login();
    expect(
      (
        await request(
          `/admin/students/${studentId}/password`,
          { password_proof: newPassword },
          admin.cookie,
        )
      ).status,
    ).toBe(200);
    expect((await request('/me', undefined, student.cookie)).status).toBe(401);
    expect(
      (await request('/login', { username: 'student01', password_proof: password })).status,
    ).toBe(401);
    expect(
      (await request('/login', { username: 'student01', password_proof: newPassword })).status,
    ).toBe(200);
  });
});

describe('rounds and weekly snapshots', () => {
  it('accepts exactly one row per completed round even when retried concurrently', async () => {
    const auth = await login();
    const event = score();
    const responses = await Promise.all([
      request('/scores', event, auth.cookie),
      request('/scores', event, auth.cookie),
    ]);
    const values = await Promise.all(
      responses.map((response) => response.json() as Promise<{ accepted: boolean }>),
    );
    expect(values.filter((value) => value.accepted)).toHaveLength(1);
    const total = await env.DB.prepare(
      'SELECT COUNT(*) AS n, SUM(points_earned) AS points FROM score_events',
    ).first();
    expect(total).toEqual({ n: 1, points: 45 });
    const account = await env.DB.prepare('SELECT lifetime_points FROM users WHERE id = ?')
      .bind(studentId)
      .first<{ lifetime_points: number }>();
    expect(account?.lifetime_points).toBe(45);
    const admin = await login('admin');
    const report = (await (await request('/admin/students', undefined, admin.cookie)).json()) as {
      students: Record<string, unknown>[];
    };
    expect(report.students[0]).toMatchObject({
      id: studentId,
      rounds: 1,
      points: 45,
      words_learned: 3,
      words_reviewed: 2,
    });
    expect(report.students[0]).not.toHaveProperty('password_hash');
  });

  it('rejects fabricated totals, bonuses, partial rounds and queues belonging to another user', async () => {
    const auth = await login();
    for (const invalid of [
      { points_earned: 9999 },
      { total_count: 1 },
      { mistakes_corrected: 5 },
      { correct_count: -1 },
      { words_learned: 5 },
    ]) {
      expect((await request('/scores', score(invalid), auth.cookie)).status).toBe(422);
    }
    expect((await request('/scores', score({ user_id: adminId }), auth.cookie)).status).toBe(403);
    expect((await request('/scores', score())).status).toBe(401);
    const admin = await login('admin');
    expect((await request('/scores', score(), admin.cookie)).status).toBe(403);
  });

  it('Cron aggregates only this Shanghai week and publishes nicknames, while reads never query D1', async () => {
    const week = schoolWeek();
    const auth = await login();
    await request('/scores', score({ id: 'current-round-0001' }), auth.cookie);
    await request('/scores', score({ id: 'previous-round-001' }), auth.cookie);
    await env.DB.prepare('UPDATE score_events SET created_at = ? WHERE id = ?')
      .bind(week.start - 1, 'previous-round-001')
      .run();
    const context = createExecutionContext();
    await worker.scheduled(
      createScheduledController({ scheduledTime: Date.now(), cron: '*/30 * * * *' }),
      env,
      context,
    );
    await waitOnExecutionContext(context);
    const response = await request('/leaderboard', undefined, undefined, {
      DB: {
        prepare: () => {
          throw new Error('must not query D1');
        },
      } as unknown as D1Database,
    });
    expect(response.status).toBe(200);
    const snapshot = (await response.json()) as { entries: unknown[]; week_start: string };
    expect(snapshot.week_start).toBe(week.key);
    // Lifetime includes both rounds; the weekly total only includes this week's.
    expect(snapshot.entries).toEqual([
      { display_name: '小橘子', points: 45, rounds: 1, lifetime_points: 90 },
    ]);
  });

  it('handles empty or unavailable KV without falling back to a D1 aggregation', async () => {
    const empty = await (await request('/leaderboard')).json();
    expect(empty).toMatchObject({ entries: [], generated_at: null });
    const failure = await request('/leaderboard', undefined, undefined, {
      LEADERBOARD: {
        get: async () => {
          throw new Error('quota');
        },
      } as unknown as KVNamespace,
    });
    expect(failure.status).toBe(503);
  });

  it('returns retryable failures when D1 quota is exhausted', async () => {
    const auth = await login();
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request('/scores', score(), auth.cookie, {
      DB: {
        prepare: () => {
          throw new Error('D1 quota');
        },
      } as unknown as D1Database,
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('D1 quota');
    logging.mockRestore();
  });

  it('changes week at Monday midnight in Shanghai, including the year boundary', () => {
    expect(schoolWeek(Date.parse('2026-11-08T15:59:59Z')).key).toBe('2026-11-02');
    expect(schoolWeek(Date.parse('2026-11-08T16:00:00Z')).key).toBe('2026-11-09');
    expect(schoolWeek(Date.parse('2027-01-01T00:00:00Z')).key).toBe('2026-12-28');
  });
});
