import type { Metadata } from 'next';
import { Oswald, Roboto_Slab } from 'next/font/google';
import { notFound } from 'next/navigation';
import { SITE_IDS, getSite, isSiteId } from '@/config/sites';
import { getDictionary } from '@/i18n';
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

export async function generateMetadata({ params }: LayoutProps<'/[site]'>): Promise<Metadata> {
  const { site } = await params;
  if (!isSiteId(site)) return {};
  return { title: getSite(site).siteTitle };
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
