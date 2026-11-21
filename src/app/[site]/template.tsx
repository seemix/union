'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Set once the first page has hydrated. Effects never run on the server, so server renders
 * and the hydrating render always see `false`.
 */
let hydrated = false;

/**
 * Re-mounts on every navigation: a short fade-in (`.page_enter`, globals.css) is the page
 * transition. The first (server-rendered) page must NOT fade in: starting at `opacity: 0`
 * hides the document and delays LCP, so only client-side navigations animate.
 */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrated = true;
  }, []);
  return <div className={hydrated ? 'page_enter' : undefined}>{children}</div>;
}
