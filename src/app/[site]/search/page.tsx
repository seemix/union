import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSiteId, type SiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { normalizeQuery } from '@/lib/search/query';
import { searchHref } from '@/lib/site/href';
import { searchPosts } from '@/lib/wp';
import { Pagination } from '../_components/Pagination/Pagination';
import { PostGrid } from '../_components/PostCard/PostGrid';
import css from './page.module.css';

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

  return (
    <>
      {/* React text child: the query is escaped, never parsed as HTML. */}
      <h2>
        {dict.search.results} <span className={css.query}>{`'${q}'`}</span>
      </h2>
      {list.items.length === 0 ? (
        <p>{dict.search.noResults}</p>
      ) : (
        <PostGrid posts={list.items} site={site} dict={dict} highlight={q} />
      )}
      <Pagination
        current={page}
        total={list.totalPages}
        basePath="/search"
        hrefOf={(n) => searchHref(q, n)}
        label={dict.a11y.pagination}
        prevLabel={dict.a11y.prevPage}
        nextLabel={dict.a11y.nextPage}
        pageLabel={dict.a11y.page}
      />
    </>
  );
}
