import type { SiteConfig } from '@/config/sites';

/** Web app manifest (https://developer.mozilla.org/docs/Web/Manifest) of one site. */
export function webManifest(site: SiteConfig) {
  return {
    name: site.siteTitle,
    short_name: site.shortName,
    description: site.description ?? site.siteTitle,
    lang: site.lang,
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: site.themeColor,
    theme_color: site.themeColor,
    icons: [
      { src: site.icons.icon192, sizes: '192x192', type: 'image/png' },
      { src: site.icons.icon512, sizes: '512x512', type: 'image/png' },
    ],
  } as const;
}
