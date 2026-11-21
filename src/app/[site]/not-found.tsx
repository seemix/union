import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from 'next/root-params';
import { isSiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { SearchForm } from './_components/SearchForm/SearchForm';
import css from './_components/StatusPage/StatusPage.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await site();
  const dict = await getDictionary(isSiteId(siteId) ? siteId : 'ru');
  return { title: dict.error.notFound };
}

// Rendered inside the `[site]` layout (header, menu, footer) for `notFound()` and for
// unknown paths (`[...rest]`). Next adds `noindex`; the HTTP status is 404 as long as
// the 404 is decided before streaming starts (see the note in post/[idSlug]/page.tsx).
// `site` is a root param, so no `params` prop is needed and nothing becomes dynamic.
export default async function NotFound() {
  const siteId = await site();
  const dict = await getDictionary(isSiteId(siteId) ? siteId : 'ru');
  return (
    <div className="main">
      <div className={css.status}>
        <span className={css.code} aria-hidden="true">
          404
        </span>
        <h2>{dict.error.notFound}</h2>
        <p>{dict.error.notFoundHint}</p>
        <div className={css.search}>
          <SearchForm placeholder={dict.search.placeholder} label={dict.a11y.search} />
        </div>
        <div className={css.actions}>
          <Link href="/" className={css.button}>
            {dict.error.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
