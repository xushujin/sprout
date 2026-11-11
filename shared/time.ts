// School weeks use Asia/Shanghai: Monday 00:00 through next Monday 00:00.
export function schoolWeek(now = Date.now()) {
  const offset = 8 * 60 * 60 * 1000;
  const local = new Date(now + offset);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - daysSinceMonday);
  return {
    key: local.toISOString().slice(0, 10),
    start: Math.floor((local.getTime() - offset) / 1000),
    end: Math.floor((local.getTime() - offset) / 1000) + 7 * 86400,
  };
}
