// Content Security Policy builder shared by both apps. Edge-safe (no node imports) so proxy.ts can use it.
//
// Strict policy: scripts run only with the per-request nonce, nothing can be framed by other sites,
// forms can only post to ourselves, plugins are off. Inline style *attributes* (React `style={}`)
// are allowed; inline <style> blocks and scripts are not.

export function newNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildCsp(opts: { nonce: string; dev: boolean; frameSrc?: string[] }): string {
  const { nonce, dev } = opts;
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // Development injects style tags for hot reload without our nonce, so it is looser there only.
    dev ? `style-src 'self' 'unsafe-inline'` : `style-src 'self' 'nonce-${nonce}'`,
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self'`,
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    `frame-src ${opts.frameSrc?.length ? opts.frameSrc.join(' ') : "'none'"}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ];
  if (!dev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

/** Headers every response should carry. HSTS only makes sense (and is only sent) over HTTPS in production. */
export function baseSecurityHeaders(prod: boolean): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    ...(prod ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains' } : {}),
  };
}
