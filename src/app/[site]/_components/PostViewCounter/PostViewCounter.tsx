'use client';

import { useEffect } from 'react';

/**
 * Posts already counted in this document. Survives re-renders, StrictMode's double effect
 * and client-side navigation back to the same post; a full reload starts over (the server
 * rate limit — once per IP + post per 30 min — is the real dedupe).
 */
const counted = new Set<number>();

function send(postId: number): void {
  if (counted.has(postId)) return;
  counted.add(postId);
  const url = `/api/views/${postId}`;
  // sendBeacon survives the tab being closed right away and never blocks navigation.
  if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return;
  void fetch(url, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {});
}

/**
 * Counts a post view (the page is cached, so the server never sees views otherwise).
 * Effects never run for `<Link>` prefetches (nothing mounts); a page prerendered by the
 * browser (Speculation Rules) is counted only once it is actually shown.
 */
export function PostViewCounter({ postId }: { postId: number }) {
  useEffect(() => {
    const doc = document as Document & { prerendering?: boolean };
    if (!doc.prerendering) {
      send(postId);
      return;
    }
    const onActivate = () => send(postId);
    doc.addEventListener('prerenderingchange', onActivate, { once: true });
    return () => doc.removeEventListener('prerenderingchange', onActivate);
  }, [postId]);
  return null;
}
