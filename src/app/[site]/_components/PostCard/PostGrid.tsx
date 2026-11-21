import type { SiteId } from '@/config/sites';
import type { Dictionary } from '@/i18n';
import { formatDate, formatNumber } from '@/i18n/format';
import { postHref } from '@/lib/site/href';
import { excerptOf, featuredImage, plainText, type WpPostSummary } from '@/lib/wp';
import { PostCard, type PostCardData } from './PostCard';
import css from './PostGrid.module.css';

/** Legacy card excerpt length (category and search). */
const EXCERPT_WORDS = 25;

function toCard(post: WpPostSummary, site: SiteId): PostCardData {
  return {
    href: postHref(post),
    title: plainText(post.title.rendered),
    excerpt: excerptOf(post.excerpt.rendered, EXCERPT_WORDS),
    image: featuredImage(post),
    date: formatDate(post.date, site),
    views: post.views > 0 ? formatNumber(post.views, site) : null,
  };
}

/** Grid of post cards of the list pages (category, search); the first row loads eagerly. */
export function PostGrid({
  posts,
  site,
  dict,
  highlight,
}: {
  posts: readonly WpPostSummary[];
  site: SiteId;
  dict: Dictionary;
  /** Search query to highlight in titles and excerpts. */
  highlight?: string;
}) {
  return (
    <div className={css.cards_wrapper}>
      {posts.map((p, i) => (
        <PostCard
          key={p.id}
          post={toCard(p, site)}
          moreLabel={dict.card.more}
          viewsLabel={dict.a11y.views}
          priority={i < 2}
          highlight={highlight}
        />
      ))}
    </div>
  );
}
