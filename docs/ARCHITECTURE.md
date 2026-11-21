# Union v2 — архітектура

## Мульти-сайт за Host

Один Next.js-застосунок обслуговує обидва сайти: `ru.baptist.org.md` і `ro.baptist.org.md`. Конфіг сайтів лежить у `src/config/sites.ts`.

### Потік запиту

```
браузер ──► GET https://ro.baptist.org.md/post/16303-slug
              │
              ▼
        src/proxy.ts  (Next 16, колишній middleware; Node runtime)
          1. сайт = siteByHost(Host)            ← прод, staging next.*, *.localhost
             у dev: SITE_OVERRIDE має пріоритет
             невідомий хост → 404 (text/plain)
          2. request header  x-site: ro          ← завжди перезаписується (клієнту не довіряємо)
          3. /api/*  → без rewrite, лише x-site  → route handler: getRequestSite()
          4. legacyRedirect()                    ← етап 5: 301 зі старих /post?id= тощо (див. нижче)
          5. /ru/… або /ro/… ззовні → 404        ← внутрішні шляхи, щоб не було дублів сторінок
          6. rewrite (внутрішній, URL у браузері не змінюється):
               /post/16303-slug  →  /ro/post/16303-slug
              │
              ▼
        src/app/[site]/layout.tsx               ← root layout, <html lang> з конфігу
        src/app/[site]/…/page.tsx               ← сайт береться з params.site
        src/app/[site]/[...rest]/page.tsx       ← будь-який невідомий шлях → notFound()
```

- **Сторінки** беруть сайт із `params.site`, а не із заголовків, тому лишаються статичними чи ISR. `generateStaticParams` у layout повертає `ru` і `ro`.
- **Route handlers** (`/api/*`) не мають `[site]` у шляху, тому сайт читається з `x-site` через `getRequestSite()` (`src/lib/site/server.ts`). `/api/views/[id]` і `/api/revalidate` читають заголовок прямо з `request.headers` (`src/lib/views/handler.ts`, `src/lib/revalidate/handler.ts`) — так їх простіше тестувати.
- **Matcher** proxy не чіпає `_next/*` і статичні файли з `public/` (за розширенням). Виняток — SEO-маршрути, що мають проходити через proxy (потрібні `x-site` і rewrite): `/robots.txt`, `/favicon.ico`, `/sitemap_index.xml`, `/sitemap/*`, `/manifest.webmanifest` (окремі записи matcher). `/api` proxy обробляє навмисно, щоб передати туди `x-site`.
- Заголовок `x-forwarded-host` не використовується: Passenger передає оригінальний `Host`.

## Запуск локально

Браузери й curl резолвлять `*.localhost` у `127.0.0.1` без змін у `hosts`.

```bash
npm run dev
# ro: http://ro.localhost:3000
# ru: http://ru.localhost:3000
# staging-вигляд: http://next.ro.localhost:3000
```

Варіант із простим `localhost` (працює лише в dev, у production ігнорується):

```bash
# .env.local
SITE_OVERRIDE=ro
```

Production-збірка локально: `npm run build && npm run start`, далі ті самі адреси `*.localhost:3000`. `SITE_OVERRIDE` тут не діє. Перевірка curl-ом без браузера:

```bash
curl -H "Host: ru.baptist.org.md" http://127.0.0.1:3000/
```

## Редиректи старих URL (етап 5, Q5)

`src/proxy.ts` → `resolveLegacy()` (`src/lib/legacy/redirects.ts`). Лише формати старого фронтенду; старі WP-адреси (`?p=`, `/2023/05/…`) не редиректимо.

| Старий URL | Відповідь |
|---|---|
| `/post?id=N` | 301 → `/post/N-{slug}` |
| `/page?id=N` | 301 → `/page/{slug}` |
| `/category?id=N&page=P` | 301 → `/category/{slug}` (P ≤ 1 або не число) / `/category/{slug}/P` |
| `/search?query=…&page=P` | 301 → `/search?q=…&page=P` (без lookup; `page` лише якщо > 1) |

- Інші query-параметри (`utm_*` тощо) зберігаються в порядку запиту, `fbclid` прибирається.
- Невалідний або неіснуючий id (WP 404, чернетка/приватний → `rest_forbidden`) → 404 сторінкою сайту (rewrite на `/[site]/_not-found` зі статусом 404), без редиректу.
- Помилка WP (таймаут 3 с, 5xx після ретраю, мережа): пост → **302** на `/post/N` (сторінка поста сама робить 308 на канонічний URL; тимчасовий, щоб браузер не закешував обхідний шлях); сторінка/категорія → **503** + `Retry-After: 60` (маршруту за id немає).
- `/post` без `id`, `/search?q=` тощо — не legacy, ідуть звичайним маршрутом.

**Кеш lookup id→slug** (`src/lib/legacy/lookup.ts`). У proxy Next 16 нічого не кешує: `use cache` там не діє, опції `fetch` (`next.revalidate`, `next.tags`) ігноруються (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, «Limitations»). Тому кешовані геттери `@/lib/wp/api` тут не використовуються, а є власний LRU у пам'яті процесу (`TtlCache`, до 2000 записів): знайдено — 1 год, не знайдено — 5 хв, помилки не кешуються; паралельні запити одного id зливаються в один запит до WP (`_fields=id,slug`). Кеш Next діє вже на сторінці, куди веде редирект. Ревалідація (`/api/revalidate`) цей кеш не чистить: перейменований пост не страшний (сторінка поста доредиректить на новий slug), перейменована сторінка/категорія дає 404 до закінчення TTL (≤ 1 год).

Посилання з конфігу (`targetHref()` у футері/віджетах) мають вигляд `/page?id=` / `/category?id=` і теж проходять через ці редиректи — для них кеш особливо важливий.

## SEO (етап 6)

- **Метадані**: layout дає дефолти (title-шаблон `%s | {siteTitle}`, іконки, manifest, OG/Twitter, `theme-color` через `generateViewport`). Кожна сторінка збирає повний набір через `buildMetadata()` (`src/lib/seo/metadata.ts`): `openGraph`/`twitter` сторінки *замінюють* layout-ові, тому дефолтне OG-зображення (`public/og/<id>.png`) додається там же. Canonical — завжди абсолютний на **прод-домен**, у тому числі зі staging. `metadataBase` свідомо не задано: іконки й manifest лишаються відносними.
- **hreflang** (Q7) — лише на головній: `ru` ⇄ `ro` (`homeLanguages()`).
- **JSON-LD** (`src/lib/seo/json-ld.ts`, компонент `JsonLd`): головна — `Organization` + `WebSite`/`SearchAction` (`@graph`); пост — `NewsArticle` + `BreadcrumbList`; категорія — `BreadcrumbList`. `<` екранується, тож `</script>` у заголовку не ламає розмітку.
- **Sitemap**: `/sitemap_index.xml` → `/sitemap/0.xml` (головна, непорожні категорії, сторінки) і `/sitemap/1…n.xml` (пости, по ≤ 5000, від старих до нових — нові пости змінюють лише останній файл). Дані — `src/lib/wp/sitemap.ts` (`use cache` + теги `posts`/`pages`/`categories`). Це власний route-handler `app/[site]/sitemap/[file]`, а не `sitemap.ts` + `generateSitemaps`: у Next `generateSitemaps()` і функція sitemap не отримують `site`, а маршрут пререндериться через автоматичний `generateStaticParams`, тому `x-site` там недоступний (500 `DYNAMIC_SERVER_USAGE`). `sitemap.xml` як ім'я теж зайняте конвенцією, тому індекс — `sitemap_index.xml`.
- **robots.txt** — route-handler `app/[site]/robots.txt` (`robots.ts` Next віддає лише з кореня `app/`). Прод-домен: `Allow: /`, `Disallow: /api/`, `Sitemap:` лише свого сайту. Будь-який інший хост (staging `next.*`, localhost): `Disallow: /`. Рішення — `isProductionHost()` (`src/config/sites.ts`); `/search` не закрито в robots свідомо, щоб краулер бачив `noindex`.
- **noindex на staging**: proxy додає `X-Robots-Tag: noindex, nofollow` до кожної відповіді не з прод-домену (`<meta>` через `generateMetadata` зробило б усі сторінки динамічними).
- **Іконки/manifest**: `scripts/generate-icons.mjs` робить із `public/logos/<id>.webp` favicon.ico, 32/192/512 px, apple-touch-icon і OG 1200×630 (`public/icons/<id>/`, `public/og/<id>.png`; шляхи — у `SiteConfig`). `/favicon.ico` → 307 на іконку сайту, `/manifest.webmanifest` — route-handler.
- **Перевірка**: `npm run check:sitemap -- "http://{site}.localhost:3000"` — усі URL із sitemap мають бути `200` без редиректу, без `noindex`, зі self-canonical і валідним JSON-LD.

## Відомі особливості

- Для `notFound()`, викликаного зі сторінки, Next 16.4.6 повертає статус 404 і `noindex`, але HTML-оболонка порожня (`<html id="__next_error__">`): UI not-found рендериться на клієнті з RSC-payload. Те саме відтворюється зі звичайним `app/layout.tsx`, тобто мультисайт тут ні до чого. У нас через це проходять усі 404 (невідомі шляхи потрапляють у catch-all із `notFound()`). Перевірено після локалізованих `not-found`/`error`/`loading` (P4.8): те саме, HTTP-статус при цьому коректний (404 для неіснуючого поста, невалідного id, невідомого шляху, `/ru/…` ззовні — обидва сайти). `not-found`/`loading` беруть сайт через `next/root-params`, `error.tsx` (клієнтський) — через `useParams`.
