'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import css from './_components/StatusPage/StatusPage.module.css';
import { useSiteDictionary } from './_components/StatusPage/useSiteDictionary';

// Client boundary: no params/root-params here, so the locale comes from `useParams`.
// Next 16.3+: `retry()` re-fetches and re-renders the segment (`reset()` only clears the state).
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const dict = useSiteDictionary();

  useEffect(() => {
    // Server-side details are hidden in production; `digest` matches the server log.
    console.error(error);
  }, [error]);

  return (
    <div className="main">
      <div className={css.status}>
        <h2>{dict.error.title}</h2>
        <p>{dict.error.fetch}</p>
        <div className={css.actions}>
          <button type="button" className={css.button} onClick={() => retry()}>
            {dict.error.retry}
          </button>
          <Link href="/" className={`${css.button} ${css.secondary}`}>
            {dict.error.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
