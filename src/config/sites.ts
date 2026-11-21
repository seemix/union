/**
 * Single source of truth for per-site configuration (Q12).
 * Values come from docs/SITES-CONFIG.md (legacy `master` = ru, `romana` = ro).
 */

export type SiteId = 'ru' | 'ro';

export const SITE_IDS = ['ru', 'ro'] as const satisfies readonly SiteId[];

/** Reference to a WP entity; resolved to a v2 route (slug-based) elsewhere. */
export type ContentTarget =
  | { readonly kind: 'page'; readonly id: number }
  | { readonly kind: 'category'; readonly id: number };

export type WidgetTone = 'gray' | 'red' | 'green';

/** Home page bottom widgets. Add a widget by adding one object to `SiteConfig.widgets`. */
export type Widget =
  | { readonly type: 'bible'; readonly label: string; readonly tone: WidgetTone }
  | {
      readonly type: 'online';
      readonly label: string;
      readonly tone: WidgetTone;
      readonly page: number;
    }
  | {
      readonly type: 'churchContacts';
      readonly label: string;
      readonly tone: WidgetTone;
      readonly page: number;
    }
  | {
      readonly type: 'category';
      readonly label: string;
      readonly tone: WidgetTone;
      readonly category: number;
      readonly icon: 'handHoldingHeart';
    };

export type WidgetType = Widget['type'];

export interface HomeSlider {
  readonly id: 'news' | 'world' | 'prayer';
  readonly variant: 'large' | 'small';
  readonly tone: 'default' | 'green' | 'red';
  readonly categoryIds: readonly number[];
  readonly count: number;
  readonly excerptLength: number;
  readonly label: string;
}

export interface FooterLink {
  readonly label: string;
  readonly target: ContentTarget;
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export interface SocialLinks {
  readonly facebook: string;
  readonly youtube: string;
  readonly instagram: string;
}

export interface SiteConfig {
  readonly id: SiteId;
  /** Production origin, no trailing slash. */
  readonly domain: string;
  /** Staging origin (Q21), no trailing slash. */
  readonly stagingDomain: string;
  /** `<html lang>`. */
  readonly lang: string;
  /** Open Graph locale. */
  readonly locale: string;
  readonly wp: {
    /** WP REST base for `/wp/v2/` (note: `?rest_route=` form, params need `&`). */
    readonly restBase: string;
    readonly graphqlEndpoint: string;
    readonly menuId: number;
  };
  readonly siteTitle: string;
  /** Default meta description; `null` = not defined yet (open question, SITES-CONFIG §4). */
  readonly description: string | null;
  /** Header `<h1>`: `accent` is highlighted in red. */
  readonly headerTitle: {
    readonly before: string;
    readonly accent: string;
    readonly after: string;
  };
  /** Path under `public/`. */
  readonly logo: string;
  readonly sliders: readonly HomeSlider[];
  readonly widgets: readonly Widget[];
  readonly footer: {
    readonly columns: readonly FooterColumn[];
    readonly contacts: {
      readonly title: string;
      readonly address: string;
      readonly phone: string;
      readonly email: string;
    };
    readonly social: SocialLinks;
    readonly copyright: string;
  };
}

const SOCIAL: SocialLinks = {
  facebook: 'https://www.facebook.com/baptist.md',
  youtube: 'https://www.youtube.com/@baptistmd',
  instagram: 'https://www.instagram.com/baptist.md/',
};

const PHONE = '+373 22 29 6701';
const EMAIL = 'baptunion@yahoo.com';
const COPYRIGHT = 'copyright © 2024 BAPTIST UNION OF MOLDOVA';

const ru: SiteConfig = {
  id: 'ru',
  domain: 'https://ru.baptist.org.md',
  stagingDomain: 'https://next.ru.baptist.org.md',
  lang: 'ru',
  locale: 'ru_RU',
  wp: {
    restBase: 'https://baptist.org.md/ru/?rest_route=/wp/v2/',
    graphqlEndpoint: 'https://baptist.org.md/ru/index.php?graphql',
    menuId: 154,
  },
  siteTitle: 'Союз церквей ЕХБ Молдовы',
  description: 'Союз церквей ЕХБ Молдовы',
  headerTitle: {
    before: 'Союз церквей ',
    accent: 'евангельских христиан-баптистов',
    after: ' Молдовы',
  },
  logo: '/logos/ru.webp',
  sliders: [
    {
      id: 'news',
      variant: 'large',
      tone: 'default',
      categoryIds: [17, 157],
      count: 5,
      excerptLength: 50,
      label: 'новости братства',
    },
    {
      id: 'world',
      variant: 'small',
      tone: 'green',
      categoryIds: [27],
      count: 5,
      excerptLength: 0,
      label: 'Христиане в мире',
    },
    {
      id: 'prayer',
      variant: 'small',
      tone: 'red',
      categoryIds: [203],
      count: 1,
      excerptLength: 0,
      label: 'молитвенная эстафета',
    },
  ],
  widgets: [
    { type: 'churchContacts', label: 'Контакты церквей', tone: 'gray', page: 111876 },
    { type: 'bible', label: 'Библия за год', tone: 'gray' },
    { type: 'online', label: 'Церковь он-лайн', tone: 'red', page: 45477 },
    {
      type: 'category',
      label: 'Дом милосердия "Тавифа"',
      tone: 'green',
      category: 205,
      icon: 'handHoldingHeart',
    },
  ],
  footer: {
    columns: [
      {
        title: 'о союзе ЕХБ',
        links: [
          { label: 'ИСТОРИЯ', target: { kind: 'page', id: 11 } },
          { label: 'ВЕРОУЧЕНИЕ', target: { kind: 'page', id: 12 } },
          { label: 'СТРУКТУРА', target: { kind: 'page', id: 14 } },
        ],
      },
      {
        title: 'новости',
        links: [
          { label: 'НОВОСТИ БРАТСТВА', target: { kind: 'category', id: 17 } },
          { label: 'ХРИСТИАНЕ В МИРЕ', target: { kind: 'category', id: 27 } },
        ],
      },
    ],
    contacts: {
      title: 'Контакты',
      address: 'г. Кишинев ул. Сергея Лазо 27/2',
      phone: PHONE,
      email: EMAIL,
    },
    social: SOCIAL,
    copyright: COPYRIGHT,
  },
};

const ro: SiteConfig = {
  id: 'ro',
  domain: 'https://ro.baptist.org.md',
  stagingDomain: 'https://next.ro.baptist.org.md',
  lang: 'ro', // legacy had `en` (bug)
  locale: 'ro_RO',
  wp: {
    restBase: 'https://baptist.org.md/ro/?rest_route=/wp/v2/',
    graphqlEndpoint: 'https://baptist.org.md/ro/index.php?graphql',
    menuId: 76,
  },
  siteTitle: 'Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova',
  description: null,
  headerTitle: {
    before: 'Uniunea Bisericilor ',
    accent: 'Creștine Evanghelice Baptiste',
    after: ' din Moldova',
  },
  logo: '/logos/ro.webp',
  sliders: [
    {
      id: 'news',
      variant: 'large',
      tone: 'default',
      categoryIds: [23],
      count: 5,
      excerptLength: 50,
      label: 'ŞTIRI INTERNE',
    },
    {
      id: 'world',
      variant: 'small',
      tone: 'green',
      categoryIds: [22],
      count: 5,
      excerptLength: 0,
      label: 'ŞTIRI EXTERNE',
    },
    {
      id: 'prayer',
      variant: 'small',
      tone: 'red',
      categoryIds: [514],
      count: 3,
      excerptLength: 0,
      label: 'ÎNTREBĂRI ŞI RĂSPUNSURI',
    },
  ],
  // Q14: ro currently has only these two. Widgets present in ru but missing here
  // (add by inserting one object, with a Romanian label):
  //   { type: 'churchContacts', label: '…', tone: 'gray', page: 111876 }
  //   { type: 'category', label: '…', tone: 'green', category: 205, icon: 'handHoldingHeart' }
  widgets: [
    { type: 'bible', label: 'Biblia peste un an', tone: 'gray' },
    { type: 'online', label: 'Biserica online', tone: 'red', page: 15459 },
  ],
  footer: {
    columns: [
      {
        title: 'DESPRE NOI',
        links: [
          { label: 'ISTORIA', target: { kind: 'page', id: 893 } },
          { label: 'MĂRTURISIREA DE CREDINȚĂ', target: { kind: 'page', id: 901 } },
          { label: 'STRUCTURA UBCEB', target: { kind: 'page', id: 898 } },
        ],
      },
      {
        title: 'ŞTIRI',
        links: [
          { label: 'ŞTIRI INTERNE', target: { kind: 'category', id: 23 } },
          { label: 'ŞTIRI EXTERNE', target: { kind: 'category', id: 22 } },
        ],
      },
    ],
    contacts: {
      title: 'contacte',
      address: 'str. Serghei Lazo 27/2',
      phone: PHONE,
      email: EMAIL,
    },
    social: SOCIAL,
    copyright: COPYRIGHT,
  },
};

const SITES: Readonly<Record<SiteId, SiteConfig>> = { ru, ro };

export function isSiteId(value: unknown): value is SiteId {
  return typeof value === 'string' && Object.hasOwn(SITES, value);
}

export function getSite(id: SiteId): SiteConfig {
  return SITES[id];
}

function hostnameOf(host: string): string {
  let h = host.trim().toLowerCase();
  // strip port
  const colon = h.lastIndexOf(':');
  if (colon !== -1) h = h.slice(0, colon);
  return h.replace(/\.$/, '');
}

/**
 * Resolves a Host header to a site: production, staging (`next.*`)
 * and local `<id>.localhost` / `next.<id>.localhost`. Unknown → null.
 */
export function siteByHost(host: string | null | undefined): SiteConfig | null {
  if (!host) return null;
  const hostname = hostnameOf(host);

  for (const id of SITE_IDS) {
    const site = SITES[id];
    if (
      hostname === new URL(site.domain).hostname ||
      hostname === new URL(site.stagingDomain).hostname
    ) {
      return site;
    }
  }

  if (hostname.endsWith('.localhost')) {
    const label = hostname.slice(0, -'.localhost'.length).replace(/^next\./, '');
    if (isSiteId(label)) return SITES[label];
  }
  return null;
}
