import { FALLBACK_IMAGE, SafeImage } from '../SafeImage/SafeImage';
import Link from 'next/link';
import { Highlight } from '../Highlight/Highlight';
import { DateViews } from '../DateViews/DateViews';
import { Reveal } from '../Reveal/Reveal';
import css from './PostCard.module.css';

export interface PostCardData {
  readonly href: string;
  readonly title: string;
  readonly excerpt: string;
  readonly image: { readonly src: string; readonly alt: string } | null;
  /** Already formatted for the site's language. */
  readonly date: string;
  /** Already formatted; `null` = no views yet. */
  readonly views: string | null;
}

/** Post card of the list pages (category, search). */
export function PostCard({
  post,
  moreLabel,
  viewsLabel,
  priority = false,
  highlight = '',
}: {
  post: PostCardData;
  moreLabel: string;
  viewsLabel: string;
  priority?: boolean;
  /** Search query whose words are highlighted in title and excerpt. */
  highlight?: string;
}) {
  const caption =
    post.title.length > 60 ? `${css.card_caption} ${css.cc_smaller}` : css.card_caption;
  return (
    <Reveal className={css.card}>
      <div className={css.picture_wrapper}>
        {/* No featured image → the placeholder, like the legacy card (`MyImage`). */}
        <SafeImage
          src={post.image?.src ?? FALLBACK_IMAGE}
          alt={post.image?.alt || post.title}
          fill
          priority={priority}
          className={css.picture}
          sizes="(max-width: 600px) 100vw, 400px"
        />
      </div>
      <div className={css.picture_overlay}>
        <h3>
          <Highlight text={post.title} query={highlight} />
        </h3>
      </div>
      <div className={css.card_bottom}>
        <DateViews views={post.views} date={post.date} viewsLabel={viewsLabel} />
        <div className={css.bottom_content}>
          <Link href={post.href}>
            <h3 className={caption}>
              <Highlight text={post.title} query={highlight} />
            </h3>
          </Link>
          <div className={css.excerpt}>
            <p>
              <Highlight text={post.excerpt} query={highlight} />
            </p>
          </div>
        </div>
        <div className={css.button_wrapper}>
          <Link href={post.href}>
            <span className={css.more_button}>{moreLabel}</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
