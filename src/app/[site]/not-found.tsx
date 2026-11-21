import type { Metadata } from 'next';
import { VscError } from 'react-icons/vsc';
import { rootDictionary } from './_components/StatusPage/rootDictionary';
import css from './_components/StatusPage/StatusPage.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await rootDictionary();
  return { title: dict.error.notFound };
}

// Rendered inside the `[site]` layout (header, menu, footer) for `notFound()` and for
// unknown paths (`[...rest]`). Next adds `noindex`; the HTTP status is 404 as long as
// the 404 is decided before streaming starts (see the note in post/[idSlug]/page.tsx).
// `site` is a root param, so no `params` prop is needed and nothing becomes dynamic.
// Markup and look are the legacy `Error` block (Q19); only the language differs (Q-i18n).
export default async function NotFound() {
  const dict = await rootDictionary();
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
