# Union v2 — етапи робіт

Позначення моделі (Claude):
- **Opus 5.5** — архітектура, складна логіка, безпека, міграційні рішення, ревʼю.
- **Sonnet 5.5** — основна розробка: перенесення сторінок/компонентів, типізація, тести.
- **Haiku 5.5** — механічні задачі: винесення рядків, перейменування, CSS, конфіги, чистка.

Залежності: етап 0 блокує все; етапи 3–4 можна вести паралельно з 2 після 1; 7 — перед запуском.

---

## Етап 0. Рішення та підготовка
- [x] Відповісти на питання з `docs/QUESTIONS.md` — *людина* (усі відповіді є)
- [x] Зібрати повний diff `master` ↔ `romana`, скласти таблицю конфігу обох сайтів — **Haiku 5.5**
- [ ] Отримати доступ до обох WP-інсталяцій (mu-plugins) і cPanel; перевірити Node ≥ 20.9 у «Setup Node.js App» — *людина*
- [ ] Зняти «еталон»: скриншоти ключових сторінок обох сайтів (desktop/mobile), список топ-URL з аналітики — **Sonnet 5.5**

## Етап 1. Каркас нового проєкту
- [x] Гілка `v2` від `romana`, `create-next-app` (Next 16, React 19, TS strict, Turbopack, `src/`) — **Haiku 5.5**
- [x] ESLint 9 flat config + Prettier, alias `@/`, `.env.example` — **Haiku 5.5**
- [x] `src/config/sites.ts` — типізована схема конфігу сайту + значення ru/ro — **Sonnet 5.5**
- [x] `proxy.ts`: визначення сайту за Host, rewrite → `/[site]/…`, dev-override — **Opus 5.5**
- [x] Словники `i18n/ru.ts`, `i18n/ro.ts` + хелпер `getDictionary(site)` — **Sonnet 5.5**
- [x] Перенести `bible.ts` у `data/bible/{ru,ro}.ts` (статично, Q13), віджет без посилання (Q13a) — **Haiku 5.5**
- [x] `next.config.ts`: `output: 'standalone'`, `images.remotePatterns`, заголовки безпеки — **Sonnet 5.5**

## Етап 2. Шар даних WordPress
- [x] `lib/wp/client.ts`: fetch до REST з `site`, `_fields`, `_embed`, обробка помилок/404, теги кешу (`cacheTag`/`cacheLife`) — **Opus 5.5**
- [x] Типи відповідей WP (posts, pages, categories, media, search) — **Sonnet 5.5**
- [x] Featured image через `_embed=wp:featuredmedia` з fallback за розмірами; прибрати залежність від `fimg_url` — **Sonnet 5.5** · 1:1 зі старим сайтом = `source_url` (оригінал): `app-thumb` ніколи не існував, див. `wp/README.md`
- [x] Єдиний маппер постів/excerpt (замість двох дублікатів), безпечне декодування HTML-сутностей — **Sonnet 5.5**
- [x] Меню через WPGraphQL (Q11), типізований запит + кеш — **Sonnet 5.5**
- [x] Unit-тести мапперів і хелперів (Vitest) — **Sonnet 5.5**

## Етап 3. WordPress: mu-плагін (замість `functions.php`)
- [x] `mu-plugins/baptist-headless.php`: захищений ендпойнт інкременту `views` (той самий мета-ключ, що й WP-PostViews; секрет із `wp-config.php`, валідація id, лише `publish`-пости) — **Opus 5.5**
- [x] Хук публікації/оновлення → `POST /api/revalidate` на відповідний фронтенд — **Opus 5.5**
- [x] (Опц.) `add_image_size('app-thumb')` в mu-плагіні, щоб розмір не залежав від теми — **Haiku 5.5** · тема його не реєструвала (`fimg_url` = оригінал), тому за замовчуванням не реєструється; опційно через `UNION_APP_THUMB_*`
- [x] Встановити в **обидві** WP-інсталяції (свій секрет і URL фронтенду в кожній), перевірити; WP-PostViews не вимикати — *людина* + **Sonnet 5.5** · 2026-11-21: маршрут живий (401 без секрету) на ru і ro; `display_errors` вимкнено, публічні `debug.log` видалено. Лишилось: `curl` інкременту із секретом
- [ ] Після запуску v2: видалити старий код (`fimg_url`, `custom/v1/view-post`) — він у **ядрі** `wp-includes/functions.php`, а не в темі (оновлення WP його зітре), див. `wp/README.md` §4 — *людина*

## Етап 4. Сторінки та маршрути
- [x] Layout: Header, TopBar/Menu, Footer, ArrowUp з конфігу/словника, правильний `lang` — **Sonnet 5.5**
- [x] Головна: паралельні запити (`Promise.all`), слайдери з конфігу, віджети з конфігу — **Sonnet 5.5**
- [x] `/post/[idSlug]`: дані, метадані, canonical-редирект при неспівпадінні slug, `notFound()` — **Opus 5.5**
- [x] `/page/[slug]` — **Sonnet 5.5**
- [x] `/category/[slug]/[[...page]]` + метадані (у ro їх зараз немає) — **Sonnet 5.5**
- [x] `/search` (Q17): лише пости, сортування за датою, безпечна підсвітка (екранування, лише текстові вузли), `noindex` — **Sonnet 5.5**
- [x] Пагінація на `<Link>` (краулиться), `rel=prev/next` не потрібен, але коректні canonical — **Sonnet 5.5**
- [x] `ContentRender` на `html-react-parser`: `<img>`→оптимізовані картинки, внутрішні `<a>`→`Link`, iframe-обгортки, lightbox — **Sonnet 5.5**
- [x] `error.tsx`, `not-found.tsx`, `loading.tsx` локалізовані — **Haiku 5.5**
- [x] Route handler `/api/views/[id]`: rate-limit, фільтр ботів, проксі в WP із секретом; клієнт на `sendBeacon` — **Opus 5.5**
- [x] Route handler `/api/revalidate` із секретом — **Sonnet 5.5**

## Етап 5. Зворотна сумісність URL
- [x] Редиректи 301 у `proxy.ts`: `/post?id=`, `/page?id=`, `/category?id=&page=`, `/search?query=` — **Opus 5.5**
- [x] Кеш lookup id→slug (щоб редирект не бив WP щоразу) — **Opus 5.5**
- [x] Тест-набір: список реальних старих URL → очікуваний 301 → 200 (скрипт/e2e) — **Sonnet 5.5** · `npm run check:redirects -- "https://{site}.baptist.org.md"`

## Етап 6. SEO
- [x] `generateMetadata` для всіх сторінок: title, description, canonical, OG, Twitter — **Sonnet 5.5**
- [x] `sitemap.ts` (пости з пагінацією WP, сторінки, категорії), `robots.ts` — для кожного сайту окремо — **Sonnet 5.5**
- [x] JSON-LD: `Organization`, `NewsArticle`, `BreadcrumbList` — **Sonnet 5.5**
- [x] `hreflang` лише на головній (Q7), OG-зображення за замовчуванням, favicon/manifest — **Haiku 5.5**
- [x] `alt` картинок із WP (`alt_text`), а не URL — **Haiku 5.5**

## Етап 7. UI та анімації
- [ ] Перенести CSS-модулі 1:1 (Q19), прибрати `FacebookRepost` (Q15), звірити зі скриншотами еталону — **Haiku 5.5**
- [x] Оновити Swiper / lightbox / react-icons, перевірити слайдери — **Sonnet 5.5**
- [x] `motion` (Q16): поява карток (stagger, `whileInView`), підменю, перехід сторінок, ArrowUp; `useReducedMotion`; слайдери — Swiper — **Sonnet 5.5**
- [x] Прибрати серверні HEAD-перевірки картинок → клієнтський fallback `onError` — **Haiku 5.5**
- [x] Доступність: фокус, `aria`, контраст, клавіатурна навігація меню — **Sonnet 5.5**

## Етап 8. Якість і перевірка
- [ ] e2e (Playwright): головна, пост, категорія + пагінація, пошук, редиректи — для обох сайтів — **Sonnet 5.5**
- [ ] Lighthouse / Core Web Vitals ≥ 90 на mobile, порівняння з поточним сайтом — **Sonnet 5.5**
- [ ] Security-ревʼю: секрети, rate-limit, XSS у контенті/пошуку, заголовки — **Opus 5.5**
- [ ] Фінальне code review всього v2 — **Opus 5.5**
- [ ] Вичитка контенту ru/ro (Q22) — *власник проєкту*

## Етап 9. Деплой і запуск
- [ ] Збірка `standalone` локально/CI, інструкція деплою на cPanel (Passenger, Q1), env для обох доменів — **Sonnet 5.5**
- [ ] Staging-піддомени `next.ro.…` / `next.ru.…` (Q21), паралельне порівняння з продом — *людина* + **Sonnet 5.5**
- [ ] Перемикання DNS / конфігу хостингу, моніторинг 404 і 5xx перші 72 год — *людина*
- [ ] (Опц., Q8 пропущено) подати sitemap у Google Search Console — *людина*
- [ ] Чистка: видалити `server.js`, `.htaccess`, `cont.html`, `back/`; архівувати гілки `master`/`romana` — **Haiku 5.5**
- [ ] README: архітектура, як додати сайт/мову, як деплоїти, як працює mu-плагін — **Haiku 5.5**
