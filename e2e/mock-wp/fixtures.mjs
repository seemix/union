// Deterministic WP fixtures for both sites. They mirror only the ids the app config
// references (src/config/sites.ts), so home sliders, footer, widgets and the legacy
// `?id=` redirects all work.

const enc = (s) => encodeURIComponent(s).toLowerCase(); // WP stores ru slugs percent-encoded, lowercase

const SITE_DATA = {
  ru: {
    menuId: 154,
    categories: [
      { id: 17, name: 'Новости братства', slug: 'новости-братства' },
      { id: 157, name: 'Новости регионов', slug: 'новости-регионов' },
      { id: 27, name: 'Христиане в мире', slug: 'христиане-в-мире' },
      { id: 203, name: 'Молитвенная эстафета', slug: 'молитвенная-эстафета' },
      { id: 205, name: 'Тавифа', slug: 'тавифа' },
    ],
    pages: [
      { id: 11, slug: 'история', title: 'История' },
      { id: 12, slug: 'вероучение', title: 'Вероучение' },
      { id: 14, slug: 'структура', title: 'Структура' },
      { id: 111876, slug: 'контакты-церквей', title: 'Контакты церквей' },
      { id: 45477, slug: 'церковь-онлайн', title: 'Церковь онлайн' },
    ],
    // category id → number of posts (the main one has 30 → 4 pages of 8)
    postsPerCategory: { 17: 30, 157: 3, 27: 6, 203: 2, 205: 2 },
    postWord: 'Пост',
    special: [
      { id: 9001, title: 'Тест <script>alert(1)</script> & "кавычки" 100%', cat: 17 },
      { id: 9002, title: 'Поиск: слово-редкость', cat: 17 },
    ],
    rareWord: 'редкость',
  },
  ro: {
    menuId: 76,
    categories: [
      { id: 23, name: 'Știri interne', slug: 'stiri-interne' },
      { id: 22, name: 'Știri externe', slug: 'stiri-externe' },
      { id: 514, name: 'Întrebări și răspunsuri', slug: 'intrebari-si-raspunsuri' },
    ],
    pages: [
      { id: 893, slug: 'istoria', title: 'Istoria' },
      { id: 901, slug: 'marturisirea-de-credinta', title: 'Mărturisirea de credință' },
      { id: 898, slug: 'structura-ubceb', title: 'Structura UBCEB' },
      { id: 15459, slug: 'biserica-online', title: 'Biserica online' },
    ],
    postsPerCategory: { 23: 30, 22: 6, 514: 4 },
    postWord: 'Articol',
    special: [
      { id: 9001, title: 'Test <script>alert(1)</script> & "ghilimele" 100%', cat: 23 },
      { id: 9002, title: 'Căutare: cuvânt-rar mămăligă', cat: 23 },
    ],
    rareWord: 'mămăligă',
  },
};

const LOREM = (n) =>
  Array.from({ length: n }, (_, i) => `Lorem ipsum dolor sit amet ${i + 1}, consectetur adipiscing elit.`).join(' ');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function makePost(d, id, title, cat, date, withImage, plainSlug = false) {
  const slug = plainSlug ? `post-${id}` : enc(title.toLowerCase().replace(/\s+/g, '-'));
  const t = escapeHtml(title);
  return {
    id,
    date,
    date_gmt: date,
    modified: date,
    modified_gmt: date,
    slug,
    status: 'publish',
    title: { rendered: t },
    excerpt: { rendered: `<p>${t}. ${LOREM(2)} [&hellip;]</p>` },
    content: { rendered: `<p>${LOREM(6)}</p><p>${LOREM(4)}</p>` },
    featured_media: withImage ? id : 0,
    views: 10 + (id % 50),
    categories: [cat],
    _cat: cat,
    _withImage: withImage,
  };
}

function buildSite(site) {
  const d = SITE_DATA[site];
  const categories = d.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: enc(c.slug),
    description: '',
    parent: 0,
    count: d.postsPerCategory[c.id] ?? 0,
  }));
  const pages = d.pages.map((p) => ({
    id: p.id,
    slug: enc(p.slug),
    modified: '2026-01-01T10:00:00',
    title: { rendered: p.title },
    content: { rendered: `<p>${p.title}. ${LOREM(3)}</p>` },
    excerpt: { rendered: `<p>${p.title}</p>` },
  }));

  const posts = [];
  let id = 1000;
  for (const [catId, count] of Object.entries(d.postsPerCategory)) {
    for (let i = 1; i <= count; i += 1) {
      id += 1;
      const day = String((id % 27) + 1).padStart(2, '0');
      const minute = String(i % 60).padStart(2, '0');
      posts.push(
        makePost(d, id, `${d.postWord} ${catId}-${i}`, Number(catId), `2026-10-${day}T10:${minute}:00`, i % 3 !== 0),
      );
    }
  }
  for (const s of d.special) {
    posts.push(makePost(d, s.id, s.title, s.cat, '2026-11-01T09:00:00', false, true));
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  return { categories, pages, posts };
}

export const DATA = { ru: buildSite('ru'), ro: buildSite('ro') };
export const RARE_WORD = { ru: SITE_DATA.ru.rareWord, ro: SITE_DATA.ro.rareWord };

export function mediaFor(post, origin) {
  const url = `${origin}/wp-content/uploads/fixture-${post.id}.png`;
  return {
    id: post.id,
    alt_text: '',
    source_url: url,
    media_details: {
      width: 240,
      height: 126,
      sizes: { medium: { width: 240, height: 126, source_url: url, mime_type: 'image/png' } },
    },
  };
}

export function menuNodes(site) {
  const d = SITE_DATA[site];
  const cat = d.categories[0];
  const page = d.pages[0];
  return [
    { databaseId: 1, parentDatabaseId: null, label: 'Group', uri: null, url: '#', connectedObject: null },
    {
      databaseId: 2,
      parentDatabaseId: 1,
      label: page.title,
      uri: `/${enc(page.slug)}/`,
      url: `https://baptist.org.md/${site}/${enc(page.slug)}/`,
      connectedObject: { __typename: 'Page', databaseId: page.id, slug: enc(page.slug) },
    },
    {
      databaseId: 3,
      parentDatabaseId: 1,
      label: cat.name,
      uri: `/category/${enc(cat.slug)}/`,
      url: `https://baptist.org.md/${site}/category/${enc(cat.slug)}/`,
      connectedObject: { __typename: 'Category', databaseId: cat.id, slug: enc(cat.slug) },
    },
    { databaseId: 4, parentDatabaseId: null, label: 'External', uri: null, url: 'https://example.org/', connectedObject: null },
  ];
}
