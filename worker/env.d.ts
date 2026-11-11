export interface Env {
  DB: D1Database;
  LEADERBOARD: KVNamespace;
  PASSWORD_PEPPER: string;
  APP_ORIGIN: string;
  LOGIN_LIMITER?: RateLimit;
  WRITE_LIMITER?: RateLimit;
  // TODO: bind AUDIO when R2-backed MP3s are enabled.
  AUDIO?: R2Bucket;
}
