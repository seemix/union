/**
 * Request header through which `src/proxy.ts` passes the resolved site to
 * pages and route handlers. The proxy always overwrites it, so a value sent
 * by the client never reaches the app.
 */
export const SITE_HEADER = 'x-site';
