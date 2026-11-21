import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_IDS, getSite, isSiteId } from '@/config/sites';

// Root layout: the whole app lives under `/[site]` (rewritten by src/proxy.ts).
// No `dynamicParams = false` here: it is inherited by `[...rest]` and turns every
// unknown path into Next's bare 404 without the site layout. Unknown `site` values
// never get here (proxy), and are guarded by `notFound()` below anyway.
export function generateStaticParams() {
  return SITE_IDS.map((site) => ({ site }));
}

export async function generateMetadata({ params }: LayoutProps<'/[site]'>): Promise<Metadata> {
  const { site } = await params;
  if (!isSiteId(site)) return {};
  return { title: getSite(site).siteTitle };
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[site]'>) {
  const { site } = await params;
  if (!isSiteId(site)) notFound();

  return (
    <html lang={getSite(site).lang}>
      <body>{children}</body>
    </html>
  );
}
