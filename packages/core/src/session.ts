// Edge-safe helpers (Web Crypto only, no database, no node:crypto) so proxy.ts can use them.
//
// The admin cookie is `<random token>.<HMAC of token>`. The HMAC lets the proxy reject garbage
// cheaply without a database call. The real check (does this token belong to a live, unrevoked
// session?) happens in the database via getAdminSession().

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function mac(token: string, secret: string): Promise<string> {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(token)));
}

export async function signToken(token: string, secret: string): Promise<string> {
  return `${token}.${await mac(token, secret)}`;
}

/** Returns the raw token if the signature is valid, otherwise null. */
export async function verifySignedToken(value: string | undefined, secret: string | undefined): Promise<string | null> {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 20) return null;
  const token = value.slice(0, dot);
  const given = value.slice(dot + 1);
  const expected = await mac(token, secret);
  if (given.length !== expected.length) return null;
  let diff = 0; // constant-time compare
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? token : null;
}
