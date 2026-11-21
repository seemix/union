'use client';

import { useEffect } from 'react';

/**
 * Counts a post view in the browser (the page itself is cached, so the server never sees views).
 *
 * TODO(P4.7): `navigator.sendBeacon('/api/views/<id>')` with the legacy 10-minute
 * per-post throttle (`localStorage`); the route handler rate-limits, filters bots
 * and proxies to the WP mu-plugin with the secret (Q9, Q10). Until then: no-op.
 */
export function PostViewCounter({ postId }: { postId: number }) {
  useEffect(() => {
    void postId;
  }, [postId]);
  return null;
}
