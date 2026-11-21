import type { Metadata, Viewport } from 'next';
import { Oswald, Roboto_Slab } from 'next/font/google';
import { notFound } from 'next/navigation';
import { SITE_IDS, getSite, isSiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
import { defaultDescription, defaultShareImage } from '@/lib/seo/metadata';
import { ArrowUp } from './_components/ArrowUp/ArrowUp';
import { Footer } from './_components/Footer/Footer';
import { Header } from './_components/Header/Header';
import { Menu } from './_components/Menu/Menu';
import { MenuStateProvider } from './_components/menu-state';
import { SocialIcons } from './_components/SocialIcons/SocialIcons';
import { TopBar } from './_components/TopBar/TopBar';
import '../globals.css';

// Cyrillic for ru, latin-ext for ro (ă, â, î, ș, ț).
const oswald = Oswald({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-oswald',
  display: 'swap',
});
const robotoSlab = Roboto_Slab({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-roboto-slab',
  display: 'swap',
});

// Root layout: the whole app lives under `/[site]` (rewritten by src/proxy.ts).
// No `dynamicParams = false` here: it is inherited by `[...rest]` and turns every
// unknown path into Next's bare 404 without the site layout. Unknown `site` values
// never get here (proxy), and are guarded by `notFound()` below anyway.
export function generateStaticParams() {
  return SITE_IDS.map((site) => ({ site }));
}

export async function generateViewport({ params }: LayoutProps<'/[site]'>): Promise<Viewport> {
  const { site } = await params;
  return isSiteId(site) ? { themeColor: getSite(site).themeColor } : {};
}

/**
 * Site-wide defaults. Pages build their own full metadata with `buildMetadata()`
 * (src/lib/seo/metadata.ts), because `openGraph`/`twitter` of a page replace these.
 * No `metadataBase`: canonical and share URLs are absolute on the production domain on
 * purpose, while icons and the manifest stay relative so staging serves its own.
 */
export async function generateMetadata({ params }: LayoutProps<'/[site]'>): Promise<Metadata> {
  const { site: siteParam } = await params;
  if (!isSiteId(siteParam)) return {};
  const site = getSite(siteParam);
  const description = defaultDescription(site);
  const image = defaultShareImage(site);
  return {
    title: { default: site.siteTitle, template: `%s | ${site.siteTitle}` },
    description,
    applicationName: site.siteTitle,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: site.icons.favicon, sizes: 'any' },
        { url: site.icons.icon32, type: 'image/png', sizes: '32x32' },
        { url: site.icons.icon192, type: 'image/png', sizes: '192x192' },
      ],
      apple: [{ url: site.icons.appleTouch, sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      siteName: site.siteTitle,
      locale: site.locale,
      title: site.siteTitle,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.siteTitle,
      description,
      images: [image.url],
    },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[site]'>) {
  const { site: siteId } = await params;
  if (!isSiteId(siteId)) notFound();
  const site = getSite(siteId);
  const dict = await getDictionary(siteId);

  return (
    <html lang={site.lang} className={`${oswald.variable} ${robotoSlab.variable}`}>
      <body>
        <MenuStateProvider>
          <Header site={site} dict={dict} />
          <TopBar
            social={<SocialIcons social={site.footer.social} />}
            closeLabel={dict.a11y.closeMenu}
          >
            <Menu site={siteId} />
          </TopBar>
        </MenuStateProvider>
        <main style={{ minHeight: '50vh' }}>{children}</main>
        <Footer site={site} />
        <ArrowUp label={dict.a11y.scrollTop} />
      </body>
    </html>
  );
}
