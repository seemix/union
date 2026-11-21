# WordPress: mu-плагін `baptist-headless`

Один файл — `mu-plugins/baptist-headless.php` — ставиться в **обидві** WP-інсталяції (Q2): `baptist.org.md/ru` і `baptist.org.md/ro`. Файл однаковий, відрізняються лише константи в `wp-config.php`.

Що робить:

| Функція | Деталі |
|---|---|
| `POST /wp-json/baptist/v1/views/{id}` | Атомарний `+1` до мета-ключа `views` (той самий, що читає WP-PostViews, Q9). Заголовок `X-Union-Secret` = `UNION_VIEWS_SECRET`. Лише `post` зі статусом `publish`. Відповідь `{"id":123,"views":457}`. |
| Ревалідація фронтенду | Публікація / оновлення / зняття з публікації / видалення поста чи сторінки, зміна й видалення категорії, збереження меню → `POST {UNION_FRONTEND_URL}/api/revalidate`. Автозбереження й ревізії ігноруються. |
| `app-thumb` | `add_image_size('app-thumb', …)` — лише якщо розміри задані константами (див. нижче). |

WP-PostViews **не вимикати**: він віддає `views` у REST. `register_post_meta('views')` плагін не робить.

## 1. Константи в `wp-config.php`

Додати **вище** рядка `/* That's all, stop editing! */`. Секрети в ru і ro — **різні**; згенерувати кожен окремо:

```sh
openssl rand -hex 32
```

**ru** (`baptist.org.md/ru/wp-config.php`):

```php
define('UNION_VIEWS_SECRET',      '<64 hex, = VIEWS_SECRET_RU у .env фронтенду>');
define('UNION_SITE',              'ru');
define('UNION_FRONTEND_URL',      'https://ru.baptist.org.md');
define('UNION_REVALIDATE_SECRET', '<64 hex, = REVALIDATE_SECRET_RU у .env фронтенду>');
```

**ro** (`baptist.org.md/ro/wp-config.php`):

```php
define('UNION_VIEWS_SECRET',      '<64 hex, = VIEWS_SECRET_RO у .env фронтенду>');
define('UNION_SITE',              'ro');
define('UNION_FRONTEND_URL',      'https://ro.baptist.org.md');
define('UNION_REVALIDATE_SECRET', '<64 hex, = REVALIDATE_SECRET_RO у .env фронтенду>');
```

- Поки v2 працює на staging (Q21), у `UNION_FRONTEND_URL` можна вказати кілька адрес через кому: `'https://next.ru.baptist.org.md'` або `'https://ru.baptist.org.md,https://next.ru.baptist.org.md'`.
- Без `UNION_VIEWS_SECRET` маршрут `baptist/v1/views` не реєструється (404 `rest_no_route`).
- Адреси в `UNION_FRONTEND_URL` мають бути `https://` (секрет іде в заголовку); `http://` приймається лише для `localhost`, `*.localhost`, `127.0.0.1`. Інші пропускаються із записом у `error_log`.
- Без будь-якої з `UNION_SITE` / `UNION_FRONTEND_URL` / `UNION_REVALIDATE_SECRET` ревалідація вимкнена, решта працює.

### `app-thumb` (необов'язково)

**Не задавати.** Тема розмір `app-thumb` ніколи не реєструвала: `fimg_url` викликає `wp_get_attachment_image_src($id, 'app-thumb')`, а для незареєстрованого розміру WP повертає **оригінал**. Тому старий сайт завжди показував повнорозмірні картинки, і жодне з ~7 900 вкладень ru/ro (перевірено через `/wp/v2/media`, 2026-11-21) не має файлу `app-thumb`. Еквівалент 1:1 на фронтенді — `source_url` з `_embed=wp:featuredmedia`.

Константи лишені на випадок, якщо колись знадобиться справжня мініатюра:

```php
define('UNION_APP_THUMB_WIDTH',  W);
define('UNION_APP_THUMB_HEIGHT', H);
define('UNION_APP_THUMB_CROP',   true);
```

Розмір генерується лише для **нових** завантажень; для старих потрібен «Regenerate Thumbnails».

## 2. Встановлення

1. Додати константи (розділ 1) у `wp-config.php` інсталяції.
2. Скопіювати `wp/mu-plugins/baptist-headless.php` у `wp-content/mu-plugins/` тієї ж інсталяції (папку `mu-plugins` створити, якщо її немає). Активувати не треба: MU-плагіни вмикаються автоматично, їх не видно серед звичайних плагінів і не можна вимкнути в адмінці.
3. Перевірити: «Плагіни → Обов'язкові» (Must-Use) показує *Baptist Headless*.
4. Повторити для другої інсталяції з її значеннями.

Вимоги: PHP 7.4+, WordPress 5.5+ (сигнатура `before_delete_post`). Жодних залежностей.

## 3. Перевірка `curl`-ом

`BASE` — корінь REST. На цих інсталяціях працює `?rest_route=` (як і у фронтенді); `/wp-json/` — якщо ввімкнені «красиві» посилання.

```sh
BASE='https://baptist.org.md/ru/?rest_route='
ID=113186                  # опублікований пост
SECRET='<UNION_VIEWS_SECRET цієї інсталяції>'

# Поточне значення
curl -s "${BASE}/wp/v2/posts/${ID}&_fields=id,views"

# +1 → 200 {"id":113186,"views":N+1}
curl -s -X POST -H "X-Union-Secret: ${SECRET}" "${BASE}/baptist/v1/views/${ID}"

# Без секрету / з невірним → 401 baptist_unauthorized
curl -s -o /dev/null -w '%{http_code}\n' -X POST "${BASE}/baptist/v1/views/${ID}"
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'X-Union-Secret: wrong' "${BASE}/baptist/v1/views/${ID}"

# Неіснуючий / чернетка / сторінка → 404 baptist_not_found
curl -s -X POST -H "X-Union-Secret: ${SECRET}" "${BASE}/baptist/v1/views/999999999"

# GET → 404 rest_no_route (лише POST)
curl -s "${BASE}/baptist/v1/views/${ID}"
```

Після `POST` значення `views` у `/wp/v2/posts/{id}` (і в адмінці WP-PostViews) має зрости на 1.

Невалідний id (`0`, `007`) → 400 `rest_invalid_param`: WP перевіряє параметри маршруту раніше за `permission_callback`. Нічого не розкриває.

**Ревалідація.** Найпростіше — оновити опублікований пост і подивитися лог фронтенду (рядок `[revalidate] ru post:… update → …`). Подивитися сирий запит можна так: тимчасово `define('UNION_FRONTEND_URL', 'https://<id>.requestcatcher.com')` (або будь-який сервіс для перехоплення запитів, або свій сервер), оновити опублікований пост — має прийти:

```http
POST /api/revalidate
Content-Type: application/json
X-Union-Secret: <UNION_REVALIDATE_SECRET>

{"site":"ru","type":"post","id":113186,"slug":"…","action":"update"}
```

`type`: `post` | `page` | `category` | `menu`; `action`: `publish` | `update` | `unpublish` | `delete`. `slug` у ru — як у WP (percent-encoded, Q4), у `menu` — порожній. На одне збереження відправляється одна подія на сутність (хуки дедуплікуються), після того як відповідь уже віддана редактору (`fastcgi_finish_request` / `litespeed_finish_request`). Після перевірки повернути справжній URL.

### Контракт для `/api/revalidate` (Next)

Реалізовано в `src/lib/revalidate/handler.ts` (тести поруч).

- `X-Union-Secret` перевіряється (`timingSafeEqual`) проти секрету сайту, який обслуговує цей хост (`x-site` з proxy): `REVALIDATE_SECRET_RU` / `REVALIDATE_SECRET_RO`. Без секрету / з чужим → 401. `site` у тілі має збігатися з хостом, інакше 400 (помилка `UNION_SITE`/`UNION_FRONTEND_URL`).
- Мапінг на теги з `src/lib/wp/tags.ts`:
  - `post` → `posts:<s>`, `post:<s>:<id>`
  - `page` → `pages:<s>`, `page:<s>:<id>`, `menu:<s>` (пункти меню посилаються на slug)
  - `category` → `categories:<s>`, `category:<s>:<id>`, `posts:<s>`, `menu:<s>`
  - `menu` → `menu:<s>`
- Профіль: `publish`/`update` → `'max'` (stale-while-revalidate), `unpublish`/`delete` → `{ expire: 0 }` (знятий контент не показується жодного разу).
- Відповідь WP не читає (`blocking: false`), тож помилки треба логувати на стороні Next.

## 4. Прибирання старого коду з `functions.php` (після перемикання на v2)

**Не раніше**, ніж прод-домен віддає v2: чинний сайт шле `POST custom/v1/view-post/{id}` і читає `fimg_url`. До запуску старий код **лишається**, обидва ендпойнти можуть працювати паралельно (пишуть у той самий ключ `views`).

Після перемикання, у кожній інсталяції:

> **Де лежить код.** На ru він дописаний у кінець **ядра** WordPress — `wp-includes/functions.php`, а не в тему. Це видно з попередження PHP: `wp-includes/functions.php` line 9411, тоді як у ядрі WP 7.1.5 цей файл має 9 398 рядків. Перевірено 2026-11-21. На ro, швидше за все, так само, але там попередження PHP не виводяться, тож це не перевірено. Саме тому `fimg_url` і лічильник «злітають»: **кожне оновлення ядра WP перезаписує цей файл**. Те саме станеться, якщо WP оновиться до запуску v2.

1. Зробити копію `wp-includes/functions.php` (і `functions.php` активної теми — перевірити, чи там теж немає цього коду).
2. Видалити з кінця файлу два блоки (у ru і ro вони однакові):
   - **`fimg_url`**: `add_action('rest_api_init', 'register_rest_images');`, функції `register_rest_images()` і `get_rest_featured_image()`;
   - **старий лічильник**: `add_action('rest_api_init', function () { register_rest_route('custom/v1', '/view-post/(?P<id>\d+)', …); });` і функцію `custom_increment_post_views_manual()`.

   Решту файлу не чіпати. `add_image_size('app-thumb')` ніде немає — прибирати нічого. Альтернатива для ядра: «Консоль → Оновлення → Перевстановити» — це відновить оригінальний `wp-includes/functions.php`.

   Чим старий лічильник гірший за новий (для довідки): відкритий для всіх (`__return_true`), рахує будь-який тип і статус поста (чернетки, сторінки, вкладення), не атомарний (`get` → `+1` → `update`, паралельні перегляди губляться), на неіснуючий пост відповідає 200 з `"status":"error"`.
3. Перевірити:
   ```sh
   # старого маршруту більше немає → 404 rest_no_route
   curl -s -X POST "${BASE}/custom/v1/view-post/${ID}"
   # fimg_url зник із відповіді, views на місці
   curl -s "${BASE}/wp/v2/posts/${ID}&_fields=id,views,fimg_url"
   ```
   плюс один `POST` на `baptist/v1/views` (розділ 3) і відкрити пост на сайті.
4. WP-PostViews **не вимикати**.
