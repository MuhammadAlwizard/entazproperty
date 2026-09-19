// Shared by proxy.ts and lib/auth.ts. No imports from next/headers so it is safe in the proxy.
//
// In production the cookie uses the `__Host-` prefix: browsers then refuse it unless it is Secure,
// has Path=/ and has NO Domain attribute, so a sibling subdomain cannot overwrite or read it.
// (On http://localhost the prefix cannot be used, so development uses a plain name.)
export const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-enjaz_admin' : 'enjaz_admin';
