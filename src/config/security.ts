/**
 * The site's security meta — ONE source of truth (plan/08 §8.1).
 *
 * Base.astro serialises these into the <meta> tags every page ships, and
 * /security renders the very same values. Change a directive here and both
 * move together; the page can never describe a policy the site does not send.
 */

/** CSP directives, in the order they are emitted. */
export const cspDirectives: readonly (readonly [string, string])[] = [
  ['default-src', "'self'"],
  ['script-src', "'self'"],
  ['style-src', "'self'"],
  ['img-src', "'self' data:"],
  ['font-src', "'self'"],
  ['connect-src', "'self'"],
  ['base-uri', "'self'"],
  ['form-action', "'self'"],
  ['object-src', "'none'"],
  ['upgrade-insecure-requests', ''],
];

export const csp = cspDirectives
  .map(([name, value]) => (value ? `${name} ${value}` : name))
  .join('; ');

export const referrerPolicy = 'strict-origin-when-cross-origin';

/**
 * What GitHub Pages cannot send: it serves static files with fixed response
 * headers, and a <meta> tag cannot carry these (plan/08 §8.1). Listed on
 * /security as a limit, not hidden.
 */
export const unavailableHeaders = [
  'Strict-Transport-Security',
  'X-Frame-Options / frame-ancestors',
  'X-Content-Type-Options',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
] as const;
