import { IoMdEye } from 'react-icons/io';
import css from './DateViews.module.css';

/** Views (hidden when 0, as legacy) and the post date in one row. */
export function DateViews({
  views,
  date,
  viewsLabel,
}: {
  /** Already formatted for the site's language. `null` = no views yet. */
  views: string | null;
  date: string;
  viewsLabel: string;
}) {
  return (
    <div className={css.date_wrapper}>
      <div className={css.views_wrapper}>
        {views !== null && (
          <>
            <IoMdEye aria-hidden />
            <p aria-label={`${viewsLabel}: ${views}`}>
              <small>{views}</small>
            </p>
          </>
        )}
      </div>
      <div className={css.card_date}>{date}</div>
    </div>
  );
}
