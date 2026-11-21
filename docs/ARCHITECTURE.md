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
          4. legacyRedirect()                    ← етап 5: 301 зі старих /post?id= тощо (поки TODO)
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
- **Route handlers** (`/api/*`) не мають `[site]` у шляху, тому сайт читається з `x-site` через `getRequestSite()` (`src/lib/site/server.ts`).
- **Matcher** proxy не чіпає `_next/*`, `favicon.ico`, `robots.txt`, `sitemap.xml` і статичні файли з `public/` (за розширенням). `/api` proxy обробляє навмисно, щоб передати туди `x-site`.
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

## Відомі особливості

- Для `notFound()`, викликаного зі сторінки, Next 16.4.6 повертає статус 404 і `noindex`, але HTML-оболонка порожня (`<html id="__next_error__">`): UI not-found рендериться на клієнті з RSC-payload. Те саме відтворюється зі звичайним `app/layout.tsx`, тобто мультисайт тут ні до чого. У нас через це проходять усі 404 (невідомі шляхи потрапляють у catch-all із `notFound()`). Перевірено після локалізованих `not-found`/`error`/`loading` (P4.8): те саме, HTTP-статус при цьому коректний (404 для неіснуючого поста, невалідного id, невідомого шляху, `/ru/…` ззовні — обидва сайти). `not-found`/`loading` беруть сайт через `next/root-params`, `error.tsx` (клієнтський) — через `useParams`.
- `robots.txt` і `sitemap.xml` виключені з matcher, тому `x-site` для них не встановлюється. На етапі 6 вони мають визначати сайт самостійно через `siteByHost(host)` або отримати rewrite у `/[site]/…`.
