# SITES-CONFIG — різниця між `master` (ru) і `romana` (ro)

Зібрано з `git diff master romana` (41 файл, +534/−610). Код не змінювався. Номери рядків — у відповідній гілці (`ru` = `master`, `ro` = `romana`). Шлях `src/app/...` скорочено до `…/`. Якщо значення не знайдено в коді — «не знайдено».

## 1. Параметри сайту

| Параметр | ru (`master`) | ro (`romana`) | Файл:рядок (ru / ro) |
|---|---|---|---|
| Frontend URL | `https://ru.baptist.org.md` (без `/`) | `https://ro.baptist.org.md/` (зі `/`) | `…/assets/common.ts:2` / `:1` |
| WP GraphQL | `https://baptist.org.md/ru/index.php?graphql` | `https://baptist.org.md/ro/index.php?graphql` | `common.ts:3` / `:2` |
| WP REST (`baseURL`) | `https://baptist.org.md/ru/?rest_route=/wp/v2/` | `https://baptist.org.md/ro/?rest_route=/wp/v2/` | `common.ts:4` / `:4` |
| Custom REST (`customBaseURL`, лічильник переглядів `/custom/v1/view-post/{id}`) | `https://baptist.org.md/ru/?rest_route=` | `https://baptist.org.md/ro/?rest_route=` | `common.ts:5` / `:5`; використання `…/components/client/PostViewCounter/PostViewCounter.tsx:16` |
| `siteTitle` (`<title>`, суфікс ` \| siteTitle` на post/page) | `Союз церквей ЕХБ Молдовы` | `Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova` | `common.ts:1` / `:3`; `…/layout.tsx:11` / `:9` |
| `<html lang>` | `ru` | `en` (схоже на помилку: має бути `ro`) | `…/layout.tsx:19` / `:17` |
| Meta description (сайт) | не задано (закоментовано: `Союз церквей ЕХБ Молдовы`) | не задано (закоментовано: `Союз церквей евангельских христиан-баптистов Молдовы` — російський текст) | `layout.tsx:12` / `:10` |
| Meta description (post/page) | з контенту через `metaDescriptionTransformer` | те саме | `…/post/page.tsx:~38`, `…/page/page.tsx:32` (однаково) |
| Title категорії | `{назва категорії} \| siteTitle` через `generateMetadata` + `getCategoryName` | **відсутній** (`generateMetadata` і `getCategoryName.ts` видалені — береться `title` з layout) | `…/category/page.tsx:12–17`, `…/category/getCategoryName.ts` (лише ru) |
| Назва категорії в `<h2>` | `getCategoryName` у page, проп `categoryName` | компонент `CategoryName` async сам робить `fetch(baseURL + 'categories/' + id)`, проп `id` | `…/category/page.tsx:25–29` / `:30`; `…/components/CategoryName/CategoryName.tsx` |
| ID меню (GraphQL `menu(id:…, idType: DATABASE_ID)`) | `154` | `76` | `…/components/Menu/query.ts:3` / `:3` |
| URL першого пункту меню | `menu[0].uri = frontendUrl` (однаково) | те саме | `…/components/Menu/Menu.tsx:14` |
| Логотип (файл) | `…/assets/images/logo.webp` (blob `efe28d6…`, 21 848 Б) | той самий шлях, інший файл (blob `732adc4…`, 11 482 Б) | `…/components/Header/Header.tsx:4,18` / `:4,19` |
| Логотип (використання) | `<Image src={logo.src} alt="logo" fill/>` | `<Image src={mainLogo.src+'?v=2'} alt="logo" placeholder="empty" fill/>` | `Header.tsx:18` / `:19` |
| Заголовок у шапці `<h1>` | `Союз церквей <red>евангельских христиан-баптистов</red> Молдовы` | `Uniunea Bisericilor <red>Creștine Evanghelice Baptiste</red> din Moldova` | `Header.tsx:11` / `:11–12` |
| Favicon | `…/favicon.ico` (blob `b5d5bfa…`) | той самий файл — **не відрізняється** | `src/app/favicon.ico` |
| Інші зображення | `fallback.webp`, `preload.webp`, `TopBar/logo1.png` — однакові в обох | однакові | `…/assets/images/`, `…/components/client/TopBar/` |
| Facebook | `https://www.facebook.com/baptist.md` | те саме | `common.ts:6` |
| YouTube | `https://www.youtube.com/@baptistmd` | те саме | `common.ts:7` |
| Instagram | `https://www.instagram.com/baptist.md/` | те саме | `common.ts:8` |
| Іконки соцмереж | Facebook, Instagram, YouTube (aria-label однакові) | те саме | `…/components/SocialIcons/SocialIcons.tsx:12–14` |
| Адреса | `г. Кишинев ул. Сергея Лазо 27/2` | `str. Serghei Lazo 27/2` (без міста) | `…/components/Footer/Footer.tsx:31–32` / `:31–32` |
| Телефон | `+373 22 29 6701` | те саме | `Footer.tsx:34` / `:33` |
| Email | `baptunion@yahoo.com` | те саме | `Footer.tsx:35` / `:34` |
| Copyright (футер) | `copyright © 2024 BAPTIST UNION OF MOLDOVA` | те саме (англійською в обох) | `Footer.tsx:38` (ro) — у ru не перевірялось окремо, у diff не змінювалось |
| Дозволений хост зображень | `baptist.org.md`, pathname `**` | `baptist.org.md`, pathname `/**` | `next.config.mjs:8–14` |
| `distDir` | закоментовано (`// distDir: 'dist'`) | `'dist'` | `next.config.mjs:7` |
| Хостинг/запуск | `next start` | `NODE_ENV=production node server.js` + `server.js` (кастомний http-сервер, ще `/a`, `/b` — шаблонні) + `.htaccess` (SPA-rewrite на `/index.html`) | `package.json:8`; `server.js`; `.htaccess` (лише ro) |
| `react-share-kit` | в залежностях | видалено | `package.json:20` (ru) |

### 1.1. Головна: категорії й кількість слайдів

`getSlides(categoryId, count, excerptLength)`; тип `categoryId`: ru `string`, ro `number` (`…/components/Main/getSlides.ts:5`). `revalidate: 60` в обох. Блок — `…/components/Main/Main.tsx`.

| Слайдер | ru (cat, кількість, довжина excerpt) | ro (cat, кількість, довжина excerpt) | Рядок (ru / ro) |
|---|---|---|---|
| Великий (новини) `NewsSwiper` | `'17,157'`, 5, 50 | `23`, 5, 50 | `Main.tsx:8` / `:8` |
| Малий 1 (`newsInWorld`, колір `green`) | `'27'`, 5, 0 | `22`, 5, 0 | `Main.tsx:9` / `:9` |
| Малий 2 (`prayerRelay`, колір `red`) | `'203'`, **1**, 0 | `514`, **3**, 0 | `Main.tsx:10` / `:10` |

Лейбли слайдерів:

| Слайдер | ru | ro | Файл:рядок |
|---|---|---|---|
| Великий (хардкод у `NewsSwiper`) | `новости братства` | `ŞTIRI INTERNE` | `…/Main/NewsSlider/client/NewsSwiper.tsx:54` |
| Малий 1 (`caption`) | `Христиане в мире` | `ŞTIRI EXTERNE` | `Main.tsx:18` |
| Малий 2 (`caption`) | `молитвенная эстафета` | `ÎNTREBĂRI ŞI RĂSPUNSURI` | `Main.tsx:21` |

Зауваження: параметри Swiper однакові; в ro закоментовано `lazy: true` (NewsSwiper:25) і `lazyLoad` (SmallNewsSwiper:32) — на тексти не впливає.

### 1.2. Футер (`…/components/Footer/Footer.tsx`)

| Блок | ru (рядок) | ro (рядок) |
|---|---|---|
| Заголовок 1 | `о союзе ЕХБ` (15) | `DESPRE NOI` (15) |
| Пункт 1.1 | `ИСТОРИЯ` → `page?id=11` (17) | `ISTORIA` → `page?id=893` (17) |
| Пункт 1.2 | `ВЕРОУЧЕНИЕ` → `page?id=12` (18) | `MĂRTURISIREA DE CREDINȚĂ` → `page?id=901` (18) |
| Пункт 1.3 | `СТРУКТУРА` → `page?id=14` (19) | `STRUCTURA UBCEB` → `page?id=898` (19) |
| Заголовок 2 | `новости` (23) | `ŞTIRI` (23) |
| Пункт 2.1 | `НОВОСТИ БРАТСТВА` → `category?id=17` (25) | `ŞTIRI INTERNE` → `category?id=23` (25) |
| Пункт 2.2 | `ХРИСТИАНЕ В МИРЕ` → `category?id=27` (26) | `ŞTIRI EXTERNE` → `category?id=22` (26) |
| Заголовок 3 | `Контакты` (30) | `contacte` (30) |

Посилання відносні (`page?id=…`, без початкового `/`) в обох гілках.

### 1.3. Віджети внизу головної (`…/components/Main/BottomWidgets/BottomWidgets.tsx`)

ru — 4 віджети, у порядку:

| # | Назва | Посилання | Іконка | Рядки |
|---|---|---|---|---|
| 1 | `Контакты церквей` | `/page?id=111876` | `LuChurch`, сірий | 16–18 |
| 2 | `Библия за год` + текст `biblePassage()` | `''` (порожнє) | `LiaBibleSolid`, сірий | 22–25 |
| 3 | `Церковь он-лайн` | `/page?id=45477` | `MdOutlineOnlinePrediction`, червоний | 29–31 |
| 4 | `Дом милосердия "Тавифа"` | `/category?id=205` | `FaHandHoldingHeart`, зелений | 35–37 |

ro — 2 віджети (віджет 1 закоментований, віджет 4 видалений):

| # | Назва | Посилання | Рядки |
|---|---|---|---|
| 1 | `Biblia peste un an` + `biblePassage()` | `''` | 20–23 |
| 2 | `Biserica online` | `/page?id=15459` | 27–29 |
| (закоментовано) | `Контакты церквей` (рос. текст, `/page?id=111876`) | — | 13–18 |

«Біблія за рік»: `…/components/Main/bible.ts` — ru: масив `bibleArray` з 365 елементів (скорочення `Быт.`, `Исх.` … `Откр.`, формат `'Быт. 1, 2, 3'`, рядки 2–366); ro: рядок `books` з 365 рядків (`Geneza 1-2` … `Apocalipsa 19-22`, формат діапазону `1-2`), `split('\n')`. Логіка вибору однакова (`dayNumber === 60 → [59]`, інакше `[dayNumber]`).

### 1.4. CSS-відмінності (візуальні, не конфіг)

`category/page.module.css` (flex → grid, `minmax(400px, 2fr)`), `Error.module.css` (padding 50px, min-width 320px, margin-top 30px), `Footer.module.css` (видалено media-query `max-width: 800px` для `.footer_bottom`), `BottomWidgets.module.css`, `NewsSwiper.module.css`, `PostCard.module.css`, `globals.css` (`.marked_text` padding `5px 0` → `5px`). У ro відсутній адаптив футера. Деталі — у `git diff master romana -- '*.css'`.

## 2. Рядки інтерфейсу (основа для i18n-словників)

`ro` = значення в гілці romana; «не перекладено» — рядок у ro залишився російським.

| Ключ (пропозиція) | Де (файл:рядок) | ru | ro |
|---|---|---|---|
| `header.title` | `Header.tsx:11` | Союз церквей евангельских христиан-баптистов Молдовы | Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova |
| `site.title` | `common.ts` | Союз церквей ЕХБ Молдовы | Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova |
| `search.placeholder` | `…/client/SearchForm/SearchForm.tsx:25` | поиск... | căutare... |
| `search.results` | `…/search/page.tsx:20` (ru) / `:18` (ro) | результаты поиска `'{query}'` | **не перекладено:** результаты поиска `'{query}'` |
| `card.more` («читати далі») | `…/PostCard/PostCard.tsx:32` | далее | mai mult |
| `slider.news_internal` | `NewsSwiper.tsx:54` | новости братства | ŞTIRI INTERNE |
| `slider.news_external` | `Main.tsx:18` | Христиане в мире | ŞTIRI EXTERNE |
| `slider.prayer` / `slider.qa` | `Main.tsx:21` | молитвенная эстафета | ÎNTREBĂRI ŞI RĂSPUNSURI |
| `widget.churches` | `BottomWidgets.tsx:18` | Контакты церквей | немає (віджет вимкнено) |
| `widget.bible_year` | `BottomWidgets.tsx:24` (ru) / `:22` (ro) | Библия за год | Biblia peste un an |
| `widget.church_online` | `BottomWidgets.tsx:31` (ru) / `:29` (ro) | Церковь он-лайн | Biserica online |
| `widget.tavifa` | `BottomWidgets.tsx:37` | Дом милосердия "Тавифа" | немає (віджет видалено) |
| `footer.about` | `Footer.tsx:15` | о союзе ЕХБ | DESPRE NOI |
| `footer.history` | `Footer.tsx:17` | ИСТОРИЯ | ISTORIA |
| `footer.faith` | `Footer.tsx:18` | ВЕРОУЧЕНИЕ | MĂRTURISIREA DE CREDINȚĂ |
| `footer.structure` | `Footer.tsx:19` | СТРУКТУРА | STRUCTURA UBCEB |
| `footer.news` | `Footer.tsx:23` | новости | ŞTIRI |
| `footer.news_internal` | `Footer.tsx:25` | НОВОСТИ БРАТСТВА | ŞTIRI INTERNE |
| `footer.news_external` | `Footer.tsx:26` | ХРИСТИАНЕ В МИРЕ | ŞTIRI EXTERNE |
| `footer.contacts` | `Footer.tsx:30` | Контакты | contacte |
| `footer.address` | `Footer.tsx:31` | г. Кишинев ул. Сергея Лазо 27/2 | str. Serghei Lazo 27/2 |
| `footer.copyright` | `Footer.tsx:38` | copyright © 2024 BAPTIST UNION OF MOLDOVA (англ., не локалізовано) | те саме |
| `error.title` | `…/Error/Error.tsx:10` | Ошибка | **не перекладено:** Ошибка |
| `error.404` | `Error.tsx:12` | 404 \| Страница не найдена | **не перекладено:** 404 \| Страница не найдена |
| `category.fetch_error` | `…/category/page.tsx:39` (ru) / `:30` (ro) | Error occurred! (англ.) | `33333` (заглушка, не текст) |
| `meta.title_suffix` | `post/page.tsx`, `page/page.tsx:31` | ` \| ` + siteTitle | ` \| ` + siteTitle |
| aria-label `menu`, `close-menu`, `search`, `Facebook`, `Instagram`, `Youtube`, alt `logo` | `BurgerMenuButton.tsx:13`, `TopBar.tsx:32`, `SearchForm.tsx:~26`, `SocialIcons.tsx:12–14`, `Header.tsx` | англійською в обох | англійською в обох |
| Пагінація | `…/client/Pagination/Pagination.tsx:39,49` | лише стрілки `⬅` `➡` та номери — тексту немає | те саме |
| Кнопка «вгору» | `ArrowUp.tsx:39` | символ `⬆` — тексту немає | те саме |
| Дата | `common/functions/dateTransformer.ts` | `DD.MM.YYYY` | те саме |
| Loader / loading.tsx | `Loader.tsx` | тексту немає | те саме |

Не знайдено в коді: окремих рядків для «Немає результатів пошуку», «Поділитися», «Назад», «Далі/Попередня» у пагінації, назв місяців, тексту `loading`.

Додатково: ru/ro відрізняється також російськомовний коментар у `layout.tsx` (не рядок інтерфейсу). Російські рядки в ro (`search.results`, `error.*`) — готові кандидати на виправлення при міграції на словники.

## 3. Фічі/компоненти лише в одній гілці

Лише `master` (ru):
- `src/app/components/FacebookRepost/FacebookRepost.tsx` (+ експорт у `components/index.ts:11`, залежність `react-share-kit`); у `post/page.tsx:51` використання закоментоване — тобто фактично вимкнено.
- `src/app/category/getCategoryName.ts` і `generateMetadata` у `category/page.tsx` (динамічний `<title>` категорії).
- Віджети «Контакти церков» (`id=111876`) та «Дім милосердя "Тавіфа"» (`category?id=205`) на головній.
- Імпорт `exp from 'node:constants'` у `components/index.ts` (сміття).
- Адаптив футера (media-query в `Footer.module.css`).
- Друга категорія (`157`) у великому слайдері (`'17,157'`).

Лише `romana` (ro):
- `server.js` (кастомний Node-сервер для хостингу, містить шаблонні маршрути `/a`, `/b`), скрипт `start` у `package.json`, `.htaccess`, `distDir: 'dist'`, `.idea/` у `.gitignore` (+ видалення `.idea/*` з репозиторію).
- `Thumbnails` у `LightBox.tsx:4,19` (мініатюри в галереї).
- `imageParser1` у `common/functions/imageParser.ts:3` — експортується, використань у коді не знайдено.
- Правка `mapper.ts`: `.replace(/&#46;/g, '.')` для коректних крапок в excerpt.
- Асинхронний `CategoryName` з власним fetch.
- `Image` логотипа з `?v=2` і `placeholder="empty"` (cache-busting).
- Окремий словник «Біблія за рік» румунською (формат діапазонів, а не списку).
- Збільшений `prayerRelay`-слайдер (3 слайди замість 1) і інші ID категорій (див. 1.1).
- Відмінності в `package-lock.json` (−33 рядки, пов'язано з видаленням `react-share-kit`).

Спільне (без змін між гілками): всі сторінки `post/page/category/search`, меню (структура), `PostViewCounter`, пагінація, `ArrowUp`, `TopBar`, `ContentRender`, `Label`, `Loader`, `Error`-логіка, соцмережі, favicon, контакти (телефон/email).

## 4. Висновки для v2 (з даних вище)

- Мовно-залежні змінні: 3 URL (`frontendUrl`, `graphqlUrl`, `baseURL`/`customBaseURL`), `siteTitle`, `lang`, `menuId` (154/76), категорії/кількість слайдів головної, лейбли слайдерів, структура футера (сторінки/категорії), набір віджетів (4 vs 2) і їхні ID, адреса, логотип, «Біблія за рік».
- Однакові в обох сайтах: соцмережі, телефон, email, favicon, copyright.
- Явні баги/сміття ro, які не треба переносити: `lang="en"`, `33333` в `category/page.tsx`, російські `search.results` та `error.*`, російський коментар-опис у `layout.tsx`.
- Відкрите питання, яке код не розв'язує: який опис сайту (`description`) використовувати — в обох гілках закоментований; для ro — не знайдено.
