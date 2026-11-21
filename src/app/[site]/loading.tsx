import { site } from 'next/root-params';
import { isSiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import css from './_components/StatusPage/StatusPage.module.css';

// Shown while a route segment streams in. The layout (header/menu/footer) stays in place.
export default async function Loading() {
  const siteId = await site();
  const dict = await getDictionary(isSiteId(siteId) ? siteId : 'ru');
  return (
    <div className="main" role="status" aria-live="polite">
      <div className={css.spinner} aria-hidden="true" />
      <span className={css.visually_hidden}>{dict.a11y.loading}</span>
    </div>
  );
}
