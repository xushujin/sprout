// Input is a 600,000-iteration client-derived credential, NOT a raw password.
// HMAC with a separate server secret + random salt + 1,000 server iterations
// keep the Worker lightweight. Database-only leaks cannot test guesses without
// the pepper; guessing a human password still requires the client stretching.
export const PBKDF2_ITERATIONS = 1_000;
const encoder = new TextEncoder();
const hex = (value: ArrayBuffer | Uint8Array) =>
  Array.from(value instanceof Uint8Array ? value : new Uint8Array(value), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
const unhex = (value: string) => new Uint8Array(value.match(/.{2}/g)!.map((x) => parseInt(x, 16)));

async function derive(password: string, salt: Uint8Array, pepper: string) {
  const pepperKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const material = await crypto.subtle.sign('HMAC', pepperKey, encoder.encode(password));
  const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: salt as Uint8Array<ArrayBuffer>,
        iterations: PBKDF2_ITERATIONS,
      },
      key,
      256,
    ),
  );
}

export async function hashPassword(password: string, pepper: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `ws_v1_pbkdf2_sha256$${PBKDF2_ITERATIONS}$${hex(salt)}$${hex(await derive(password, salt, pepper))}`;
}

export async function verifyPassword(password: string, stored: string, pepper: string) {
  if (!/^ws_v1_pbkdf2_sha256\$1000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(stored)) return false;
  const [, , salt, expected] = stored.split('$');
  const actual = await derive(password, unhex(salt), pepper);
  const expectedBytes = unhex(expected);
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) mismatch |= actual[i] ^ expectedBytes[i];
  return mismatch === 0;
}

// Unknown accounts still perform the same password derivation.
export const DUMMY_HASH = `ws_v1_pbkdf2_sha256$1000$${'00'.repeat(16)}$${'00'.repeat(32)}`;
export const newToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const hashToken = async (token: string) =>
  hex(await crypto.subtle.digest('SHA-256', encoder.encode(token)));
