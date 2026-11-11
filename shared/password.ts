// Expensive password stretching runs in the browser (or Node seed script),
// never in the 10 ms Workers Free request budget. This is a password-equivalent
// credential: send ONLY over HTTPS, never persist/log it or use it as a token.
export const CLIENT_PASSWORD_ITERATIONS = 600_000;

export async function derivePasswordProof(username: string, password: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  // The public, account-specific client salt is deterministic so login needs no
  // preflight database query. A separate RANDOM salt is added on the server.
  const salt = encoder.encode(`WordSprout:password:v1:${username.trim().toLowerCase()}`);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: CLIENT_PASSWORD_ITERATIONS },
    key,
    256,
  );
  return Array.from(new Uint8Array(derived), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
