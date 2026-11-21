import type { Metadata } from 'next';
import { site } from 'next/root-params';
import { VscError } from 'react-icons/vsc';
import { isSiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
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
// Markup and look are the legacy `Error` block (Q19); only the language differs (Q-i18n).
export default async function NotFound() {
  const siteId = await site();
  const dict = await getDictionary(isSiteId(siteId) ? siteId : 'ru');
  return (
    <div className="main">
      <div className={css.error_wrapper}>
        <h2>
          <VscError aria-hidden="true" /> {dict.error.title}
        </h2>
        <h1>{dict.error.notFound}</h1>
      </div>
    </div>
  );
}
