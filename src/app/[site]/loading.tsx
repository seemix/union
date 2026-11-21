import { rootDictionary } from './_components/StatusPage/rootDictionary';
import css from './_components/StatusPage/StatusPage.module.css';

// Shown while a route segment streams in. The layout (header/menu/footer) stays in place.
export default async function Loading() {
  const dict = await rootDictionary();
  return (
    <div className="main" role="status" aria-live="polite">
      <div className={css.spinner} aria-hidden="true" />
      <span className={css.visually_hidden}>{dict.a11y.loading}</span>
    </div>
  );
}
