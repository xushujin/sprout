import type { Env } from './env';
import type { User, Student } from '../shared/types';
import { hashPassword, hashToken, newToken, verifyPassword, DUMMY_HASH } from '../shared/crypto';
import { schoolWeek } from '../shared/time';
import { isAvatarConfig, itemById, parseAvatar, parseOwned } from '../shared/avatar';

const SESSION_COOKIE = '__Host-ws_session';
const STUDENT_SESSION_SECONDS = 30 * 86400;
const ADMIN_SESSION_SECONDS = 2 * 3600;
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

type Context = { request: Request; env: Env };

function headers(extra: HeadersInit = {}) {
  const result = new Headers({
    ...JSON_HEADERS,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Frame-Options': 'DENY',
  });
  for (const [key, value] of Object.entries(extra)) result.set(key, value);
  return result;
}

function json(data: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: headers(extra) });
}

function error(message: string, status = 400, code?: string) {
  return json({ error: message, ...(code ? { code } : {}) }, status);
}

function text(data: string, status = 200) {
  return new Response(data, {
    status,
    headers: headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
  });
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  for (const cookie of cookieHeader.split(';')) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

function cookie(value: string, maxAge?: number) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

function originAllowed(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return false;
  if (request.method === 'GET') return !origin || origin === env.APP_ORIGIN;
  // JSON + an exact Origin check also protect login/logout against CSRF.
  return origin === env.APP_ORIGIN;
}

async function body(request: Request) {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error('JSON_REQUIRED');
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > 16_384) throw new Error('BODY_TOO_LARGE');
  // Do not trust Content-Length (chunked requests can omit it).
  const reader = request.body?.getReader();
  if (!reader) throw new Error('JSON_REQUIRED');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) {
      await reader.cancel();
      throw new Error('BODY_TOO_LARGE');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON_REQUIRED');
  return value as Record<string, unknown>;
}

function validUsername(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$/.test(value);
}

function validPasswordProof(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function validDisplayName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 20;
}

async function rateLimit(binding: RateLimit | undefined, key: string) {
  if (!binding) return true;
  try {
    return (await binding.limit({ key })).success;
  } catch {
    return false;
  }
}

async function currentUser(request: Request, env: Env): Promise<User | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.display_name, u.role, u.lifetime_points AS points, u.avatar, u.owned_items
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(tokenHash, Math.floor(Date.now() / 1000))
    .first<User & { points: number; avatar: string | null; owned_items: string }>();
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    role: row.role,
    points: Number(row.points),
    avatar: parseAvatar(row.avatar),
    owned_items: parseOwned(row.owned_items),
  };
}

async function requireUser(request: Request, env: Env, role?: User['role']) {
  const user = await currentUser(request, env);
  if (!user) return { response: error('请先登录。', 401, 'UNAUTHENTICATED') } as const;
  if (role && user.role !== role)
    return { response: error('没有权限。', 403, 'FORBIDDEN') } as const;
  return { user } as const;
}

async function changeStudentUsername(request: Request, env: Env, studentId: string) {
  const auth = await requireUser(request, env, 'admin');
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return error('学生编号不正确。', 422);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const proof = input.password_proof;
  if (!validUsername(username) || !validPasswordProof(proof))
    return error('账号或密码格式不正确。', 422);
  // The login proof is derived from username + password, so the admin must set
  // a new password at the same time; changing only the name would lock the
  // student out. The proof sent here already uses the new username.
  const passwordHash = await hashPassword(proof, env.PASSWORD_PEPPER);
  try {
    const results = await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET username = ?, password_hash = ? WHERE id = ? AND role = 'student'",
      ).bind(username, passwordHash, studentId),
      env.DB.prepare(
        "DELETE FROM sessions WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND role = 'student')",
      ).bind(studentId, studentId),
    ]);
    if (!results[0].meta.changes) return error('找不到学生。', 404);
  } catch (cause) {
    if (String(cause).toLowerCase().includes('unique'))
      return error('用户名已经存在。', 409, 'USERNAME_TAKEN');
    throw cause;
  }
  return json({ ok: true, username });
}

async function saveAvatar(request: Request, env: Env) {
  const auth = await requireUser(request, env);
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  if (!isAvatarConfig(input.avatar)) return error('形象配置不正确。', 422);
  const owned = auth.user.owned_items ?? [];
  for (const item of Object.values(input.avatar.items)) {
    if (item && !owned.includes(item)) return error('还没有购买这件装饰。', 403, 'ITEM_NOT_OWNED');
  }
  await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?')
    .bind(JSON.stringify(input.avatar), auth.user.id)
    .run();
  return json({ ok: true, avatar: input.avatar });
}

async function purchase(request: Request, env: Env) {
  const auth = await requireUser(request, env);
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  const itemId = typeof input.item_id === 'string' ? input.item_id : '';
  const item = itemById(itemId);
  if (!item) return error('没有这件装饰。', 404, 'ITEM_NOT_FOUND');
  const owned = auth.user.owned_items ?? [];
  if (owned.includes(item.id)) return error('已经拥有这件装饰。', 409, 'ALREADY_OWNED');
  const nextOwned = [...owned, item.id];
  const now = Math.floor(Date.now() / 1000);
  // Conditional update + guarded spend insert in one transaction. If the
  // balance is too low the update changes 0 rows and changes() suppresses the
  // spend row, so the purchase cannot go negative.
  const [updated] = await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET lifetime_points = lifetime_points - ?, owned_items = ? WHERE id = ? AND lifetime_points >= ?',
    ).bind(item.price, JSON.stringify(nextOwned), auth.user.id, item.price),
    env.DB.prepare(
      'INSERT INTO spend_events(id, user_id, item_id, amount, created_at) SELECT ?, ?, ?, ?, ? WHERE changes() = 1',
    ).bind(crypto.randomUUID(), auth.user.id, item.id, item.price, now),
  ]);
  if (updated.meta.changes !== 1)
    return error('积分不够，再攒一攒吧。', 402, 'INSUFFICIENT_POINTS');
  const account = await env.DB.prepare('SELECT lifetime_points AS points FROM users WHERE id = ?')
    .bind(auth.user.id)
    .first<{ points: number }>();
  return json({
    ok: true,
    item: item.id,
    points: Number(account?.points ?? 0),
    owned_items: nextOwned,
  });
}

async function login(request: Request, env: Env) {
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const password = input.password_proof;
  if (!validPasswordProof(password) || username.length > 32)
    return error('账号或密码不正确。', 401, 'INVALID_CREDENTIALS');
  const rememberMe = input.rememberMe === true;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (
    !(await rateLimit(env.LOGIN_LIMITER, `ip:${ip}`)) ||
    !(await rateLimit(env.LOGIN_LIMITER, `account:${username.toLowerCase()}`))
  )
    return error('尝试次数太多，请稍后再试。', 429, 'RATE_LIMITED');

  const user = validUsername(username)
    ? await env.DB.prepare(
        'SELECT id, username, display_name, role, password_hash, lifetime_points AS points, avatar, owned_items FROM users WHERE username = ? COLLATE NOCASE',
      )
        .bind(username)
        .first<
          User & {
            password_hash: string;
            points: number;
            avatar: string | null;
            owned_items: string;
          }
        >()
    : null;
  const passwordHash = user?.password_hash ?? DUMMY_HASH;
  const passwordOk = await verifyPassword(password, passwordHash, env.PASSWORD_PEPPER);
  if (!user || !passwordOk) return error('账号或密码不正确。', 401, 'INVALID_CREDENTIALS');

  const now = Math.floor(Date.now() / 1000);
  const lifetime =
    user.role === 'admin'
      ? ADMIN_SESSION_SECONDS
      : rememberMe
        ? STUDENT_SESSION_SECONDS
        : undefined;
  const expiresAt = now + (lifetime ?? 12 * 3600);
  const rawToken = newToken();
  const tokenHash = await hashToken(rawToken);
  // One active session per account keeps session storage bounded.
  const sessionResults = await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    // A password reset between verification and INSERT must not recreate access.
    env.DB.prepare(
      'INSERT INTO sessions(token_hash, user_id, expires_at) SELECT ?, id, ? FROM users WHERE id = ? AND password_hash = ?',
    ).bind(tokenHash, expiresAt, user.id, passwordHash),
  ]);
  if (!sessionResults[1].meta.changes) return error('密码已变更，请重新登录。', 401);
  const safeUser: User = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    points: Number(user.points),
    avatar: parseAvatar(user.avatar),
    owned_items: parseOwned(user.owned_items),
  };
  return json({ user: safeUser }, 200, { 'Set-Cookie': cookie(rawToken, lifetime) });
}

async function logout(request: Request, env: Env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token && /^[0-9a-f]{64}$/.test(token))
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await hashToken(token))
      .run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
}

function parseScore(input: Record<string, unknown>) {
  const integer = (key: string, min: number, max: number) => {
    const value = input[key];
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
      ? value
      : null;
  };
  const id =
    typeof input.id === 'string' && /^[a-zA-Z0-9_-]{10,80}$/.test(input.id) ? input.id : null;
  const wordsLearned = integer('words_learned', 0, 5);
  const wordsReviewed = integer('words_reviewed', 0, 5);
  const correctCount = integer('correct_count', 0, 5);
  const totalCount = integer('total_count', 5, 5);
  const mistakesCorrected = integer('mistakes_corrected', 0, 5);
  if (
    !id ||
    wordsLearned === null ||
    wordsReviewed === null ||
    correctCount === null ||
    totalCount === null ||
    mistakesCorrected === null
  )
    return null;
  if (
    wordsLearned + wordsReviewed !== 5 ||
    correctCount > 5 ||
    mistakesCorrected > wordsReviewed ||
    mistakesCorrected > correctCount
  )
    return null;
  const pointsEarned = correctCount * 10 + mistakesCorrected * 5;
  if (input.points_earned !== pointsEarned) return null;
  return {
    id,
    wordsLearned,
    wordsReviewed,
    correctCount,
    totalCount,
    mistakesCorrected,
    pointsEarned,
  };
}

async function submitScore(request: Request, env: Env) {
  const auth = await requireUser(request, env, 'student');
  if ('response' in auth) return auth.response;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await rateLimit(env.WRITE_LIMITER, `${auth.user.id}:${ip}`)))
    return error('提交太频繁，请稍后再试。', 429, 'RATE_LIMITED');
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  if (input.user_id !== auth.user.id)
    return error('账号已切换，请重新登录后同步。', 403, 'ACCOUNT_CHANGED');
  const score = parseScore(input);
  if (!score) return error('学习结果不符合要求。', 422, 'INVALID_SCORE');
  const now = Math.floor(Date.now() / 1000);
  // changes() in the second statement is 1 only when the INSERT actually inserted,
  // so a retried round cannot inflate the lifetime total. The batch is transactional.
  const [inserted] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO score_events
      (id, user_id, words_learned, words_reviewed, correct_count, total_count, mistakes_corrected, points_earned, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, id) DO NOTHING`,
    ).bind(
      score.id,
      auth.user.id,
      score.wordsLearned,
      score.wordsReviewed,
      score.correctCount,
      score.totalCount,
      score.mistakesCorrected,
      score.pointsEarned,
      now,
    ),
    env.DB.prepare(
      'UPDATE users SET lifetime_points = lifetime_points + ? WHERE id = ? AND changes() = 1',
    ).bind(score.pointsEarned, auth.user.id),
  ]);
  return json({
    ok: true,
    accepted: inserted.meta.changes === 1,
    points_earned: score.pointsEarned,
  });
}

async function leaderboard(request: Request, env: Env) {
  const week = schoolWeek();
  const range = new URL(request.url).searchParams.get('range') === 'all' ? 'all' : 'week';
  const key = range === 'all' ? 'leaderboard:all' : `leaderboard:${week.key}`;
  try {
    const value = (await env.LEADERBOARD.get(key, 'json')) as {
      range?: string;
      week_start?: string;
      generated_at?: number;
      entries?: unknown[];
    } | null;
    if (!value || !Array.isArray(value.entries))
      return json({
        range,
        ...(range === 'week' ? { week_start: week.key } : {}),
        generated_at: null,
        entries: [],
      });
    return json({ ...value, range });
  } catch {
    return error('榜单稍后更新。', 503, 'TEMPORARY_FAILURE');
  }
}

async function createStudent(request: Request, env: Env) {
  const auth = await requireUser(request, env, 'admin');
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const displayName = typeof input.display_name === 'string' ? input.display_name.trim() : '';
  const password = input.password_proof;
  if (!validUsername(username) || !validDisplayName(displayName) || !validPasswordProof(password))
    return error('用户名、昵称或密码凭据格式不正确。', 422);
  const passwordHash = await hashPassword(password, env.PASSWORD_PEPPER);
  try {
    await env.DB.prepare(
      "INSERT INTO users(id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, 'student', ?)",
    )
      .bind(crypto.randomUUID(), username, passwordHash, displayName, Math.floor(Date.now() / 1000))
      .run();
  } catch (cause) {
    if (String(cause).toLowerCase().includes('unique'))
      return error('用户名已经存在。', 409, 'USERNAME_TAKEN');
    throw cause;
  }
  return json({ ok: true }, 201);
}

async function resetStudentPassword(request: Request, env: Env, studentId: string) {
  const auth = await requireUser(request, env, 'admin');
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return error('学生编号不正确。', 422);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  if (!validPasswordProof(input.password_proof)) return error('密码凭据格式不正确。', 422);
  // D1 batch is transactional: reset and revocation succeed or roll back together.
  const results = await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'student'").bind(
      await hashPassword(input.password_proof, env.PASSWORD_PEPPER),
      studentId,
    ),
    env.DB.prepare(
      "DELETE FROM sessions WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND role = 'student')",
    ).bind(studentId, studentId),
  ]);
  if (!results[0].meta.changes) return error('找不到学生。', 404);
  return json({ ok: true });
}

async function updateStudentDisplayName(request: Request, env: Env, studentId: string) {
  const auth = await requireUser(request, env, 'admin');
  if ('response' in auth) return auth.response;
  if (!(await rateLimit(env.WRITE_LIMITER, auth.user.id)))
    return error('操作太频繁，请稍后再试。', 429);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return error('学生编号不正确。', 422);
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return error('请求格式不正确。', 400);
  }
  const displayName = typeof input.display_name === 'string' ? input.display_name.trim() : '';
  if (!validDisplayName(displayName)) return error('昵称需要 1–20 个字符。', 422);
  const result = await env.DB.prepare(
    "UPDATE users SET display_name = ? WHERE id = ? AND role = 'student'",
  )
    .bind(displayName, studentId)
    .run();
  if (!result.meta.changes) {
    const student = await env.DB.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'")
      .bind(studentId)
      .first();
    if (!student) return error('找不到学生。', 404);
  }
  return json({ ok: true, display_name: displayName });
}

async function listStudents(request: Request, env: Env) {
  const auth = await requireUser(request, env, 'admin');
  if ('response' in auth) return auth.response;
  const cursor = new URL(request.url).searchParams.get('cursor') ?? '';
  if (cursor && !/^[0-9a-f-]{36}$/i.test(cursor)) return error('分页参数不正确。', 422);
  const week = schoolWeek();
  // Totals are all-time so the page is never blank on Monday morning; the
  // current week is returned alongside for the small secondary line.
  const rows = await env.DB.prepare(
    `WITH selected AS (
    SELECT * FROM users WHERE role = 'student' AND id > ? ORDER BY id LIMIT 51
  ), totals AS (
    SELECT e.user_id, COUNT(*) AS rounds,
      COALESCE(SUM(e.words_learned), 0) AS words_learned,
      COALESCE(SUM(e.words_reviewed), 0) AS words_reviewed,
      COALESCE(SUM(e.correct_count), 0) AS correct_count,
      COALESCE(SUM(e.total_count), 0) AS total_count,
      COALESCE(SUM(e.points_earned), 0) AS earned_points,
      MAX(e.created_at) AS last_active
    FROM score_events e
    WHERE e.user_id IN (SELECT id FROM selected)
    GROUP BY e.user_id
  ), weekly AS (
    SELECT e.user_id, COUNT(*) AS week_rounds,
      COALESCE(SUM(e.points_earned), 0) AS week_points
    FROM score_events e
    WHERE e.user_id IN (SELECT id FROM selected) AND e.created_at >= ? AND e.created_at < ?
    GROUP BY e.user_id
  )
  SELECT u.id, u.username, u.display_name, u.role, u.created_at,
    COALESCE(t.rounds, 0) AS rounds,
    COALESCE(t.words_learned, 0) AS words_learned,
    COALESCE(t.words_reviewed, 0) AS words_reviewed,
    COALESCE(t.correct_count, 0) AS correct_count,
    COALESCE(t.total_count, 0) AS total_count,
    COALESCE(u.lifetime_points, 0) AS points,
    COALESCE(t.earned_points, 0) AS earned_points,
    COALESCE(w.week_rounds, 0) AS week_rounds,
    COALESCE(w.week_points, 0) AS week_points,
    t.last_active
    FROM selected u
    LEFT JOIN totals t ON t.user_id = u.id
    LEFT JOIN weekly w ON w.user_id = u.id
    ORDER BY u.id`,
  )
    .bind(cursor, week.start, week.end)
    .all<Student>();
  const students = rows.results ?? [];
  return json({
    students: students.slice(0, 50),
    next_cursor: students.length > 50 ? students[49].id : null,
    week_start: week.key,
  });
}

export async function generateLeaderboard(env: Env, scheduledTime = Date.now()) {
  const week = schoolWeek(scheduledTime);
  const rows = await env.DB.prepare(
    `WITH spent AS (
      SELECT user_id, SUM(amount) AS amount FROM spend_events
      WHERE created_at >= ? AND created_at < ? GROUP BY user_id
    )
    SELECT u.display_name, u.lifetime_points,
      MAX(COALESCE(SUM(e.points_earned), 0) - COALESCE(s.amount, 0), 0) AS points,
      COUNT(e.id) AS rounds
    FROM score_events e JOIN users u ON u.id = e.user_id
    LEFT JOIN spent s ON s.user_id = u.id
    WHERE u.role = 'student' AND e.created_at >= ? AND e.created_at < ?
    GROUP BY u.id ORDER BY points DESC, rounds DESC, u.display_name COLLATE NOCASE ASC LIMIT 100`,
  )
    .bind(week.start, week.end, week.start, week.end)
    .all<{ display_name: string; lifetime_points: number; points: number; rounds: number }>();
  const snapshot = {
    range: 'week',
    week_start: week.key,
    generated_at: Date.now(),
    entries: (rows.results ?? []).map((row) => ({
      display_name: row.display_name,
      points: Number(row.points),
      rounds: Number(row.rounds),
      lifetime_points: Number(row.lifetime_points),
    })),
  };
  await env.LEADERBOARD.put(`leaderboard:${week.key}`, JSON.stringify(snapshot), {
    expirationTtl: 8 * 86400,
  });

  // All-time uses the current balance, not a sum of historical events, so
  // decorations are reflected immediately. No TTL: the last good snapshot
  // survives a paused Cron.
  const allRows = await env.DB.prepare(
    `SELECT u.display_name, u.lifetime_points, COUNT(e.id) AS rounds
     FROM users u LEFT JOIN score_events e ON e.user_id = u.id
     WHERE u.role = 'student'
     GROUP BY u.id
     HAVING u.lifetime_points > 0 OR COUNT(e.id) > 0
     ORDER BY u.lifetime_points DESC, rounds DESC, u.display_name COLLATE NOCASE ASC
     LIMIT 100`,
  ).all<{ display_name: string; lifetime_points: number; rounds: number }>();
  const allSnapshot = {
    range: 'all',
    generated_at: Date.now(),
    entries: (allRows.results ?? []).map((row) => ({
      display_name: row.display_name,
      points: Number(row.lifetime_points),
      rounds: Number(row.rounds),
      lifetime_points: Number(row.lifetime_points),
    })),
  };
  await env.LEADERBOARD.put('leaderboard:all', JSON.stringify(allSnapshot));
}

async function route({ request, env }: Context) {
  const url = new URL(request.url);
  if (url.pathname === '/health') return text('ok');
  if (!url.pathname.startsWith('/api/')) return error('Not found', 404);
  if (!env.PASSWORD_PEPPER || env.PASSWORD_PEPPER.length < 32 || !env.APP_ORIGIN)
    return error('服务尚未完成配置。', 503);
  if (!originAllowed(request, env)) return error('跨站请求被拒绝。', 403);
  const path = url.pathname.slice('/api'.length);
  if (request.method === 'GET' && path === '/me') {
    const user = await currentUser(request, env);
    return user ? json({ user }) : error('请先登录。', 401, 'UNAUTHENTICATED');
  }
  if (request.method === 'PATCH' && path === '/me/avatar') return saveAvatar(request, env);
  if (request.method === 'POST' && path === '/shop/purchase') return purchase(request, env);
  if (request.method === 'POST' && path === '/login') return login(request, env);
  if (request.method === 'POST' && path === '/logout') return logout(request, env);
  if (request.method === 'POST' && path === '/scores') return submitScore(request, env);
  if (request.method === 'GET' && path === '/leaderboard') return leaderboard(request, env);
  if (request.method === 'POST' && path === '/admin/students') return createStudent(request, env);
  if (request.method === 'GET' && path === '/admin/students') return listStudents(request, env);
  const studentMatch = path.match(/^\/admin\/students\/([0-9a-f-]+)$/i);
  if (request.method === 'PATCH' && studentMatch)
    return updateStudentDisplayName(request, env, studentMatch[1]);
  const resetMatch = path.match(/^\/admin\/students\/([0-9a-f-]+)\/password$/i);
  if (request.method === 'POST' && resetMatch)
    return resetStudentPassword(request, env, resetMatch[1]);
  const usernameMatch = path.match(/^\/admin\/students\/([0-9a-f-]+)\/username$/i);
  if (request.method === 'PATCH' && usernameMatch)
    return changeStudentUsername(request, env, usernameMatch[1]);
  return error('Not found', 404);
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await route({ request, env });
    } catch {
      // Never log passwords, cookies, SQL parameters or request bodies.
      console.error('WordSprout API temporarily unavailable');
      return error('服务暂时不可用，请稍后重试。', 503, 'TEMPORARY_FAILURE');
    }
  },
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(generateLeaderboard(env, event.scheduledTime));
  },
};
