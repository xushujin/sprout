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
    env.DB.prepare('DELETE FROM gift_events'),
    env.DB.prepare('DELETE FROM spend_events'),
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
  it('lets only an admin change a student login name and revokes the old session', async () => {
    const student = await login();
    const admin = await login('admin');
    const changed = await request(
      `/admin/students/${studentId}/username`,
      { username: 'student02', password_proof: newPassword },
      admin.cookie,
      undefined,
      'PATCH',
    );
    expect(changed.status).toBe(200);
    expect(await changed.json()).toMatchObject({ ok: true, username: 'student02' });

    // The old session is revoked and the old credentials no longer work.
    expect((await request('/me', undefined, student.cookie)).status).toBe(401);
    expect(
      (await request('/login', { username: 'student01', password_proof: password })).status,
    ).toBe(401);
    const relogin = await request('/login', {
      username: 'student02',
      password_proof: newPassword,
    });
    expect(relogin.status).toBe(200);

    // Students cannot use the admin endpoint.
    const cookie = relogin.headers.get('Set-Cookie')!.split(';')[0];
    expect(
      (
        await request(
          `/admin/students/${studentId}/username`,
          { username: 'student03', password_proof: password },
          cookie,
          undefined,
          'PATCH',
        )
      ).status,
    ).toBe(403);

    // A duplicate name is rejected.
    expect(
      (
        await request(
          `/admin/students/${studentId}/username`,
          { username: 'admin', password_proof: password },
          admin.cookie,
          undefined,
          'PATCH',
        )
      ).status,
    ).toBe(409);
  });
});

describe('avatar and shop', () => {
  it('saves the free avatar but refuses decorations and paid styles that are not owned', async () => {
    const auth = await login();
    const avatar = {
      gender: 'girl',
      hair: 'bob',
      face: 'round',
      skin: 'light',
      outfit: 'blouse',
      items: {},
    };
    const saved = await request('/me/avatar', { avatar }, auth.cookie, undefined, 'PATCH');
    expect(saved.status).toBe(200);

    const notOwned = await request(
      '/me/avatar',
      { avatar: { ...avatar, items: { hat: 'straw_hat' } } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(notOwned.status).toBe(403);

    const locked = await request(
      '/me/avatar',
      { avatar: { ...avatar, hair: 'ponytail' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(locked.status).toBe(403);
    expect(((await locked.json()) as { code?: string }).code).toBe('STYLE_LOCKED');

    const invalid = await request(
      '/me/avatar',
      { avatar: { ...avatar, skin: 'blue' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(invalid.status).toBe(422);
  });

  it('drops the retired face option', async () => {
    const auth = await login();
    const saved = await request(
      '/me/avatar',
      { avatar: { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'tee', face: 'oval' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(saved.status).toBe(200);
    const expected = { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'tee' };
    expect(((await saved.json()) as { avatar: unknown }).avatar).toEqual(expected);

    const me = await request('/me', undefined, auth.cookie);
    expect(((await me.json()) as { user: User }).user.avatar).toEqual(expected);
  });

  it('unlocks paid styles once, deducts points and records the spend', async () => {
    const auth = await login();
    await env.DB.prepare('UPDATE users SET lifetime_points = 2500 WHERE id = ?')
      .bind(studentId)
      .run();

    const free = await request('/wardrobe/unlock', { kind: 'hair', option: 'bob' }, auth.cookie);
    expect(free.status).toBe(409);
    expect(((await free.json()) as { code?: string }).code).toBe('STYLE_FREE');

    const invalid = await request(
      '/wardrobe/unlock',
      { kind: 'hat', option: 'straw_hat' },
      auth.cookie,
    );
    expect(invalid.status).toBe(422);

    const hair = await request(
      '/wardrobe/unlock',
      { kind: 'hair', option: 'ponytail' },
      auth.cookie,
    );
    expect(hair.status).toBe(200);
    expect(((await hair.json()) as { points: number }).points).toBe(1500);

    const again = await request(
      '/wardrobe/unlock',
      { kind: 'hair', option: 'ponytail' },
      auth.cookie,
    );
    expect(again.status).toBe(409);

    const skin = await request('/wardrobe/unlock', { kind: 'skin', option: 'deep' }, auth.cookie);
    expect(skin.status).toBe(200);
    expect(((await skin.json()) as { points: number }).points).toBe(1000);

    const saved = await request(
      '/me/avatar',
      { avatar: { gender: 'girl', hair: 'ponytail', skin: 'deep', outfit: 'blouse' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(saved.status).toBe(200);

    // 1000 left: the 1500 outfit cannot be unlocked, and no spend row appears.
    const outfit = await request(
      '/wardrobe/unlock',
      { kind: 'outfit', option: 'dress' },
      auth.cookie,
    );
    expect(outfit.status).toBe(402);

    const spends = await env.DB.prepare(
      'SELECT item_id, amount FROM spend_events ORDER BY amount',
    ).all();
    expect(spends.results).toEqual([
      { item_id: 'skin:deep', amount: 500 },
      { item_id: 'hair:ponytail', amount: 1000 },
    ]);

    const me = await request('/me', undefined, auth.cookie);
    const user = ((await me.json()) as { user: User }).user;
    expect(user.unlocked_styles).toEqual(['hair:ponytail', 'skin:deep']);
  });

  it('charges 3000 for the formal outfits', async () => {
    const auth = await login();
    await env.DB.prepare('UPDATE users SET lifetime_points = 3500 WHERE id = ?')
      .bind(studentId)
      .run();

    const unlock = await request(
      '/wardrobe/unlock',
      { kind: 'outfit', option: 'royal' },
      auth.cookie,
    );
    expect(unlock.status).toBe(200);
    expect(((await unlock.json()) as { points: number }).points).toBe(500);
    const spend = await env.DB.prepare(
      "SELECT item_id, amount FROM spend_events WHERE item_id = 'outfit:royal'",
    ).first();
    expect(spend).toEqual({ item_id: 'outfit:royal', amount: 3000 });

    const saved = await request(
      '/me/avatar',
      { avatar: { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'royal' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
    expect(saved.status).toBe(200);

    // 500 left: the second formal outfit is out of reach.
    const poor = await request(
      '/wardrobe/unlock',
      { kind: 'outfit', option: 'ceremony' },
      auth.cookie,
    );
    expect(poor.status).toBe(402);
  });

  it('buys a decoration once, deducts points and records the spend', async () => {
    const auth = await login();
    await env.DB.prepare('UPDATE users SET lifetime_points = 500 WHERE id = ?')
      .bind(studentId)
      .run();
    const bought = await request('/shop/purchase', { item_id: 'straw_hat' }, auth.cookie);
    expect(bought.status).toBe(200);
    const body = (await bought.json()) as { points: number; owned_items: string[] };
    expect(body.points).toBe(380);
    expect(body.owned_items).toContain('straw_hat');

    const account = await env.DB.prepare('SELECT lifetime_points FROM users WHERE id = ?')
      .bind(studentId)
      .first<{ lifetime_points: number }>();
    expect(account?.lifetime_points).toBe(380);
    const spend = await env.DB.prepare('SELECT item_id, amount FROM spend_events WHERE user_id = ?')
      .bind(studentId)
      .all();
    expect(spend.results).toEqual([{ item_id: 'straw_hat', amount: 120 }]);

    const again = await request('/shop/purchase', { item_id: 'straw_hat' }, auth.cookie);
    expect(again.status).toBe(409);

    await env.DB.prepare('UPDATE users SET lifetime_points = 50 WHERE id = ?')
      .bind(studentId)
      .run();
    const poor = await request('/shop/purchase', { item_id: 'crown' }, auth.cookie);
    expect(poor.status).toBe(402);
    const still = await env.DB.prepare('SELECT lifetime_points FROM users WHERE id = ?')
      .bind(studentId)
      .first<{ lifetime_points: number }>();
    expect(still?.lifetime_points).toBe(50);
  });

  it('subtracts this week’s spends from the leaderboard and keeps the stage points current', async () => {
    const auth = await login();
    await request('/scores', score({ id: 'week-round-0001' }), auth.cookie);
    await env.DB.prepare('UPDATE users SET lifetime_points = 500 WHERE id = ?')
      .bind(studentId)
      .run();
    await request('/shop/purchase', { item_id: 'straw_hat' }, auth.cookie);

    const context = createExecutionContext();
    await worker.scheduled(
      createScheduledController({ scheduledTime: Date.now(), cron: '*/30 * * * *' }),
      env,
      context,
    );
    await waitOnExecutionContext(context);
    const snapshot = (await (await request('/leaderboard')).json()) as {
      entries: { points: number; lifetime_points: number; rounds: number }[];
    };
    // 45 earned this week minus a 120 spend clamps to 0; lifetime is 500 - 120.
    expect(snapshot.entries[0]).toMatchObject({ points: 0, rounds: 1, lifetime_points: 380 });
  });
});

describe('admin point gifts', () => {
  it('gifts points once and ignores a retried request id', async () => {
    const admin = await login('admin');
    const first = await request(
      `/admin/students/${studentId}/points`,
      { id: 'gift-test-0001', amount: 250, note: '课堂奖励' },
      admin.cookie,
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ accepted: true, points: 0, gift_points: 250 });

    const again = await request(
      `/admin/students/${studentId}/points`,
      { id: 'gift-test-0001', amount: 250, note: '重复提交' },
      admin.cookie,
    );
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ accepted: false, points: 0, gift_points: 250 });

    const gifts = await env.DB.prepare('SELECT amount, note, admin_id FROM gift_events').all();
    expect(gifts.results).toEqual([{ amount: 250, note: '课堂奖励', admin_id: adminId }]);

    const list = (await (await request('/admin/students', undefined, admin.cookie)).json()) as {
      students: Student[];
    };
    expect(list.students[0].points).toBe(0);
    expect(list.students[0].gift_points).toBe(250);
  });

  it('spends reward points before growth points', async () => {
    const auth = await login();
    await env.DB.prepare('UPDATE users SET gift_points = 700, lifetime_points = 1000 WHERE id = ?')
      .bind(studentId)
      .run();

    const unlock = await request(
      '/wardrobe/unlock',
      { kind: 'hair', option: 'ponytail' },
      auth.cookie,
    );
    expect(unlock.status).toBe(200);
    expect(await unlock.json()).toMatchObject({
      price: 1000,
      points: 700,
      gift_points: 0,
      spent_points: 300,
      spent_gift: 700,
    });
    const spend = await env.DB.prepare(
      "SELECT item_id, amount FROM spend_events WHERE item_id = 'hair:ponytail'",
    ).first();
    expect(spend).toEqual({ item_id: 'hair:ponytail', amount: 300 });
  });

  it('never turns reward points into growth points or a weekly deduction', async () => {
    const auth = await login();
    await env.DB.prepare('UPDATE users SET gift_points = 3000, lifetime_points = 0 WHERE id = ?')
      .bind(studentId)
      .run();
    const unlock = await request(
      '/wardrobe/unlock',
      { kind: 'outfit', option: 'royal' },
      auth.cookie,
    );
    expect(unlock.status).toBe(200);
    expect(await unlock.json()).toMatchObject({
      points: 0,
      gift_points: 0,
      spent_points: 0,
      spent_gift: 3000,
    });
    const spend = await env.DB.prepare('SELECT COUNT(*) AS count FROM spend_events').first();
    expect(spend).toEqual({ count: 0 });
  });

  it('rejects student callers, invalid amounts and unknown students', async () => {
    const student = await login();
    const forbidden = await request(
      `/admin/students/${studentId}/points`,
      { id: 'gift-test-0002', amount: 10 },
      student.cookie,
    );
    expect(forbidden.status).toBe(403);

    const admin = await login('admin');
    for (const amount of [0, -1, 1.5, 10_001, '10']) {
      const invalid = await request(
        `/admin/students/${studentId}/points`,
        { id: 'gift-test-0003', amount },
        admin.cookie,
      );
      expect(invalid.status).toBe(422);
    }

    const missing = await request(
      '/admin/students/00000000-0000-4000-8000-000000000099/points',
      { id: 'gift-test-0004', amount: 10 },
      admin.cookie,
    );
    expect(missing.status).toBe(404);
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
      week_rounds: 1,
      week_points: 45,
    });
    expect(report.students[0]).not.toHaveProperty('password_hash');
  });

  it('keeps all-time totals in the admin list when the current week is empty', async () => {
    const auth = await login();
    await request('/scores', score({ id: 'last-week-round-01' }), auth.cookie);
    await env.DB.prepare('UPDATE score_events SET created_at = ? WHERE id = ?')
      .bind(schoolWeek().start - 1, 'last-week-round-01')
      .run();
    const admin = await login('admin');
    const report = (await (await request('/admin/students', undefined, admin.cookie)).json()) as {
      students: Record<string, unknown>[];
    };
    expect(report.students[0]).toMatchObject({
      rounds: 1,
      points: 45,
      week_rounds: 0,
      week_points: 0,
    });
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

  it('Cron aggregates only this Shanghai week and publishes nicknames and avatars, while reads never query D1', async () => {
    const week = schoolWeek();
    const auth = await login();
    await request('/scores', score({ id: 'current-round-0001' }), auth.cookie);
    await request('/scores', score({ id: 'previous-round-001' }), auth.cookie);
    await request(
      '/me/avatar',
      { avatar: { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'tee' } },
      auth.cookie,
      undefined,
      'PATCH',
    );
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
      {
        display_name: '小橘子',
        points: 45,
        rounds: 1,
        lifetime_points: 90,
        avatar: { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'tee' },
      },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain(studentId);

    const all = (await (
      await request('/leaderboard?range=all', undefined, undefined, {
        DB: {
          prepare: () => {
            throw new Error('must not query D1');
          },
        } as unknown as D1Database,
      })
    ).json()) as { range: string; week_start?: string; entries: unknown[] };
    expect(all.range).toBe('all');
    expect(all.week_start).toBeUndefined();
    expect(all.entries).toEqual([
      {
        display_name: '小橘子',
        points: 90,
        rounds: 2,
        lifetime_points: 90,
        avatar: { gender: 'boy', hair: 'buzz', skin: 'light', outfit: 'tee' },
      },
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
