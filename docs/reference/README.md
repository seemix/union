# Еталон продакшн-сайтів (для порівняння 1:1 з v2)

Знято: 2026-11-21. **ro — з продакшну `https://ro.baptist.org.md`; ru — з ЛОКАЛЬНОЇ збірки гілки `master` (`next build && next start`, порт 3100), бо продакшн ru зламаний (див. нижче).** Chrome (Playwright, `channel: chrome`), full-page, ширини 390 і 1440 px (висота вікна 900). Перед знімком сторінка прокручувалась донизу й назад (щоб спрацювали lazy-картинки й анімації). Файли: `docs/reference/{ro,ru}/<сторінка>-<ширина>.png`.

Параметри: ro — пост 16303, сторінка футера `page?id=893` (Istoria), категорія 23 (ŞTIRI INTERNE), пошук `biserica`. ru — пост 113186, сторінка футера `page?id=11` (История), категорія 17 (новости братства), пошук `церковь`. Неіснуючий пост: `id=999999999`.

## ⚠️ Чому ru — локальний, а не продакшн

На `https://ru.baptist.org.md` усі внутрішні сторінки (`/post`, `/page`, `/category`, `/search`, неіснуючий пост) віддають **HTTP 500** («Application error…»); головна — 200, але з усіма зламаними картинками слайдерів. WP REST ru працює (200).

**Імовірна причина 500:** GraphQL-меню з `menu(id: 154, …)` (`src/app/components/Menu/query.ts`, гілка master) на ru WP тепер повертає `data.menu = null` (на ro id 154 існує — це інше меню, «Glodeni»). `mappedMenu` падає на `menu.data.menu.menuItems`; `Menu` рендериться в `layout.tsx` на кожній сторінці. Те саме падіння відтворилось при локальному `next build` (prerender `/` і всіх сторінок). Головна на проді, ймовірно, віддається зі старого кешу.

**Як зроблено локальний еталон ru (лише в тимчасовій копії, репозиторій не змінено):** `git worktree` з `master` у тимчасовій папці, у `Menu.tsx` запит замінено на статичний JSON, зібраний із DOM меню продакшн-головної ru (8 пунктів: Главная, О союзе ЕХБ(6), Новости(2), Служения(4), Ресурсы(8), Партнёры(2), Актуально(3), Română). Решта — код `master` без змін, дані (пости, категорії, картинки) — з живого WP ru. Тож меню на знімках ru відповідає проду, але ID меню в WP треба буде з'ясувати для v2. Картинки на локальній збірці вантажаться нормально, тобто зламані картинки на проді — проблема середовища, а не коду.

## Результати по сторінках

| Сайт | Сторінка | URL | HTTP | Нотатки |
|---|---|---|---|---|
| ro | home | https://ro.baptist.org.md/ | 200 | title: «Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «REPORTAJ VIDEO: CONFERINȚA PASTORALĂ 2026 – TREI ZILE DE PĂRTĂȘIE, ÎNV»; html lang="en" |
| ro | post | https://ro.baptist.org.md/post?id=16303 | 200 | title: «Reportaj video: Conferința Pastorală 2026 – Trei zile de părtășie, învățătură și încurajare | Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «REPORTAJ VIDEO: CONFERINȚA PASTORALĂ 2026 – TREI ZILE DE PĂRTĂȘIE, ÎNV»; html lang="en"; консоль: warning powerPreference (WebGPU, ігнорувати); горизонтальний скрол на 390 |
| ro | page | https://ro.baptist.org.md/page?id=893 | 200 | title: «Istoria | Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «ISTORIA»; html lang="en"; консоль: warning: Mixed Content: The page at 'https://ro.baptist.org.md/page?id=893' was loaded over HTTPS, but request; консоль: warning: Mixed Content: The page at 'https://ro.baptist.org.md/page?id=893' was loaded over HTTPS, but request; консоль: warning: Mixed Content: The page at 'https://ro.baptist.org.md/page?id=893' was loaded over HTTPS, but request; консоль: warning: Mixed Content: The page at 'https://ro.baptist.org.md/page?id=893' was loaded over HTTPS, but request |
| ro | category-p1 | https://ro.baptist.org.md/category?id=23 | 200 | title: «Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «ŞTIRI INTERNE»; html lang="en"; горизонтальний скрол на 390 |
| ro | category-p2 | https://ro.baptist.org.md/category?id=23&page=2 | 200 | title: «Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «ŞTIRI INTERNE»; html lang="en"; горизонтальний скрол на 390 |
| ro | search | https://ro.baptist.org.md/search?query=biserica | 200 | title: «Uniunea Bisericilor Creștine Evanghelice Baptiste din Moldova»; h2: «РЕЗУЛЬТАТЫ ПОИСКА 'BISERICA'»; html lang="en"; заголовок «результаты поиска» російською на ro |
| ro | notfound | https://ro.baptist.org.md/post?id=999999999 | 200 | title: «(порожній)»; h2: « ОШИБКА»; html lang="en"; консоль: error: Error: An error occurred in the Server Components render. The specific message is omitted in production; **код 200 при помилці (soft 404)**; текст помилки російською («Ошибка», «404 | Страница не найдена») |
| ru (локально, master) | home | http://localhost:3100/ | 200 | title: «Союз церквей ЕХБ Молдовы»; h2: «ПРАЗДНИК 40-ЛЕТИЯ ОСВЯЩЕНИЯ ДОМА МОЛИТВЫ ЦЕРКВИ «ВЕФИЛЬ»»; html lang="ru" |
| ru (локально, master) | post | http://localhost:3100/post?id=113186 | 200 | title: «Праздник 40-летия освящения Дома молитвы церкви «Вефиль» | Союз церквей ЕХБ Молдовы»; h2: «ПРАЗДНИК 40-ЛЕТИЯ ОСВЯЩЕНИЯ ДОМА МОЛИТВЫ ЦЕРКВИ «ВЕФИЛЬ»»; html lang="ru" |
| ru (локально, master) | page | http://localhost:3100/page?id=11 | 200 | title: «История | Союз церквей ЕХБ Молдовы»; h2: «ИСТОРИЯ»; html lang="ru" |
| ru (локально, master) | category-p1 | http://localhost:3100/category?id=17 | 200 | title: «Новости братства | Союз церквей ЕХБ Молдовы»; h2: «НОВОСТИ БРАТСТВА»; html lang="ru" |
| ru (локально, master) | category-p2 | http://localhost:3100/category?id=17&page=2 | 200 | title: «Новости братства | Союз церквей ЕХБ Молдовы»; h2: «НОВОСТИ БРАТСТВА»; html lang="ru" |
| ru (локально, master) | search | http://localhost:3100/search?query=%D1%86%D0%B5%D1%80%D0%BA%D0%BE%D0%B2%D1%8C | 200 | title: «Союз церквей ЕХБ Молдовы»; h2: «РЕЗУЛЬТАТЫ ПОИСКА 'ЦЕРКОВЬ'»; html lang="ru" |
| ru (локально, master) | notfound | http://localhost:3100/post?id=999999999 | 200 | title: «(порожній)»; h2: « ОШИБКА»; html lang="ru"; **код 200 при помилці (soft 404)**, текст «Ошибка» / «404 | Страница не найдена»; консоль: Server Components render error (очікувано) |
## Спостереження
- ro: усі сторінки віддають 200, включно з неіснуючим постом (soft 404 з екраном помилки). `<html lang="en">` на всіх сторінках. На `page?id=893` — Mixed Content: картинки з `http://baptist.org.md/ro/wp-content/uploads/...` на https-сторінці.
- ro: на сторінці категорії `<title>` дорівнює загальному `siteTitle` (немає назви категорії).
- ru (прод): головна 200, але картинки слайдерів зламані; у меню є пункт «ROMÂNĂ». Віджет «Библия за год» показує «Деян. 24, 25, 26».
- ru (локально): помилок консолі, зламаних картинок і запитів ≥400 немає; пошук `церковь` повертає результати.
- Помилки консолі/невдалі запити (requestfailed): не зафіксовано, окрім перелічених у таблиці.
- Скрипт знімання лежав поза репозиторієм (тимчасова папка); у проєкті нічого не змінено, залежності не додавались.
