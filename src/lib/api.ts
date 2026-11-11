export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  timeout?: number;
}

export async function api<T>(path: string, data?: unknown, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), options.timeout ?? 10_000);
  try {
    const response = await fetch(`/api${path}`, {
      method: options.method ?? (data === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(response.status, payload?.error ?? '暂时连接不上，请稍后再试。');
    // Pages' SPA fallback or an Access login page can return 200 HTML. Treat it
    // as unavailable so a queued round is never accidentally acknowledged.
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new ApiError(503, '暂时连接不上，请稍后再试。');
    return payload as T;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    throw new ApiError(0, '暂时连接不上，已完成的学习会保存在本机。');
  } finally {
    window.clearTimeout(timer);
  }
}
