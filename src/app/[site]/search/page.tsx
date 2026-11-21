import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSiteId, type SiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { formatDate, formatNumber } from '@/i18n/format';
import { normalizeQuery } from '@/lib/search/query';
import { postHref, searchHref } from '@/lib/site/href';
import { excerptOf, featuredImage, plainText, searchPosts } from '@/lib/wp';
import { Pagination } from '../_components/Pagination/Pagination';
import { PostCard, type PostCardData } from '../_components/PostCard/PostCard';
import css from '../category/[slug]/[[...page]]/category.module.css';

const EXCERPT_WORDS = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `?page=` → 1-based page; anything but plain digits falls back to page 1. */
function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,9}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

// Search results depend on the request, so everything runtime-bound (`searchParams`)
// is read inside <Suspense> (Cache Components); the WP call itself is cached per (q, page).
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PageProps<'/[site]/search'>['params'];
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { site: siteParam } = await params;
  if (!isSiteId(siteParam)) return {};
  const dict = await getDictionary(siteParam);
  const q = normalizeQuery((await searchParams).q);
  return {
    title: q ? `${dict.search.results} '${q}'` : dict.a11y.search,
    // Result pages are thin / infinite: keep them out of the index, let crawlers follow links.
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ params, searchParams }: PageProps<'/[site]/search'>) {
  return (
    <div className="main">
      <Suspense fallback={null}>
        <Results params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({
  params,
  searchParams,
}: {
  params: PageProps<'/[site]/search'>['params'];
  searchParams: SearchParams;
}) {
  const { site: siteParam } = await params;
  if (!isSiteId(siteParam)) notFound();
  const site: SiteId = siteParam;
  const dict = await getDictionary(site);
  const sp = await searchParams;
  const q = normalizeQuery(sp.q);
  const page = parsePage(sp.page);

  if (!q) return <h2>{dict.search.enterQuery}</h2>;

  const list = await searchPosts(site, { q, page });
  if (!list) notFound(); // page past the last one

  const cards: PostCardData[] = list.items.map((p) => ({
    href: postHref(p),
    title: plainText(p.title.rendered),
    excerpt: excerptOf(p.excerpt.rendered, EXCERPT_WORDS),
    image: featuredImage(p),
    date: formatDate(p.date, site),
    views: p.views > 0 ? formatNumber(p.views, site) : null,
  }));

  return (
    <>
      {/* React text child: the query is escaped, never parsed as HTML. */}
      <h2>{`${dict.search.results} '${q}'`}</h2>
      {cards.length === 0 ? (
        <p>{dict.search.noResults}</p>
      ) : (
        <div className={css.cards_wrapper}>
          {cards.map((post, i) => (
            <PostCard
              key={post.href}
              post={post}
              moreLabel={dict.card.more}
              viewsLabel={dict.a11y.views}
              priority={i < 2}
              highlight={q}
            />
          ))}
        </div>
      )}
      <Pagination
        current={page}
        total={list.totalPages}
        basePath="/search"
        hrefOf={(n) => searchHref(q, n)}
        label={dict.a11y.pagination}
        prevLabel={dict.a11y.prevPage}
        nextLabel={dict.a11y.nextPage}
      />
    </>
  );
}
