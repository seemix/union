// Mock WordPress for e2e: REST (`?rest_route=`), WPGraphQL menu, views endpoint, media.
// Started by Playwright's webServer; the app reaches it through ./preload.cjs.
import http from 'node:http';
import zlib from 'node:zlib';
import { DATA, mediaFor, menuNodes } from './fixtures.mjs';

const PORT = Number(process.env.MOCK_WP_PORT ?? 4010);
const MEDIA_ORIGIN = 'https://baptist.org.md'; // what the app believes the media host is
const VIEWS_SECRET = { ru: process.env.VIEWS_SECRET_RU, ro: process.env.VIEWS_SECRET_RO };
let viewLog = [];

function crc32(buf) {
  let crc = ~0;
  for (const b of buf) {
    let c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}

function png(w, h, [r, g, b]) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const IMG = png(240, 126, [90, 120, 160]);

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}
const err = (res, status, code, message) => json(res, status, { code, message, data: { status } });

function withEmbed(site, post, full) {
  const { _cat, _withImage, ...rest } = post;
  const embedded = {};
  if (_withImage) embedded['wp:featuredmedia'] = [mediaFor(post, MEDIA_ORIGIN)];
  if (full) {
    const c = DATA[site].categories.find((x) => x.id === _cat);
    embedded['wp:term'] = [[{ id: c.id, name: c.name, slug: c.slug, taxonomy: 'category' }], []];
  }
  return { ...rest, _embedded: embedded };
}

function handleRest(site, route, q, res) {
  const d = DATA[site];
  const m = route.match(/^\/wp\/v2\/(posts|pages|categories)(?:\/(\d+))?$/);
  if (!m) return err(res, 404, 'rest_no_route', 'No route');
  const [, kind, idRaw] = m;
  const id = idRaw ? Number(idRaw) : null;

  if (kind === 'posts') {
    if (id !== null) {
      const p = d.posts.find((x) => x.id === id);
      return p
        ? json(res, 200, withEmbed(site, p, true))
        : err(res, 404, 'rest_post_invalid_id', 'Invalid post ID.');
    }
    let list = d.posts;
    const cats = q.get('categories');
    if (cats) {
      const set = new Set(cats.split(',').map(Number));
      list = list.filter((p) => set.has(p._cat));
    }
    const search = q.get('search');
    if (search) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      // WP searches the raw (unescaped) text.
      const raw = (h) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      list = list.filter((p) =>
        words.every((w) => raw(`${p.title.rendered} ${p.content.rendered}`).toLowerCase().includes(w)),
      );
    }
    const perPage = Number(q.get('per_page') ?? 10);
    const page = Number(q.get('page') ?? 1);
    const totalPages = Math.ceil(list.length / perPage);
    const headers = { 'X-WP-Total': String(list.length), 'X-WP-TotalPages': String(totalPages) };
    if (page > Math.max(totalPages, 1)) {
      return err(res, 400, 'rest_post_invalid_page_number', 'The page number requested is larger than the number of pages available.');
    }
    const slice = list.slice((page - 1) * perPage, page * perPage);
    return json(res, 200, slice.map((p) => withEmbed(site, p, false)), headers);
  }

  const coll = kind === 'pages' ? d.pages : d.categories;
  if (id !== null) {
    const x = coll.find((e) => e.id === id);
    return x ? json(res, 200, x) : err(res, 404, 'rest_term_invalid', 'Not found');
  }
  const slug = q.get('slug');
  const found = slug ? coll.filter((e) => e.slug === encodeURIComponent(decodeURIComponent(slug)).toLowerCase()) : coll;
  return json(res, 200, found, { 'X-WP-Total': String(found.length), 'X-WP-TotalPages': '1' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://mock');
  const p = url.pathname;

  if (p === '/__mock/views') return json(res, 200, viewLog);
  if (p === '/__mock/reset') {
    viewLog = [];
    return json(res, 200, { ok: true });
  }
  if (p === '/__mock/health') return json(res, 200, { ok: true });

  if (/^\/wp-content\/uploads\/fixture-\d+\.png$/.test(p)) {
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600' });
    return res.end(IMG);
  }

  const s = p.match(/^\/(ru|ro)\/(.*)$/);
  if (!s) return err(res, 404, 'rest_no_route', 'No route');
  const site = s[1];

  if (url.searchParams.has('graphql') && req.method === 'POST') {
    req.resume();
    return json(res, 200, { data: { menu: { menuItems: { nodes: menuNodes(site) } } } });
  }

  const route = url.searchParams.get('rest_route');
  if (!route) return err(res, 404, 'rest_no_route', 'No route');

  const views = route.match(/^\/baptist\/v1\/views\/(\d+)$/);
  if (views) {
    if (req.method !== 'POST') return err(res, 405, 'rest_no_route', 'POST only');
    const secret = req.headers['x-union-secret'];
    if (!secret || secret !== VIEWS_SECRET[site]) return err(res, 403, 'rest_forbidden', 'Bad secret');
    const id = Number(views[1]);
    const post = DATA[site].posts.find((x) => x.id === id);
    if (!post) return err(res, 404, 'rest_post_invalid_id', 'Invalid post ID.');
    post.views += 1;
    viewLog.push({ site, id });
    return json(res, 200, { id, views: post.views });
  }
  if (req.method !== 'GET') return err(res, 405, 'rest_no_route', 'GET only');
  return handleRest(site, route, url.searchParams, res);
});

server.listen(PORT, '127.0.0.1', () => console.log(`[mock-wp] http://127.0.0.1:${PORT}`));
