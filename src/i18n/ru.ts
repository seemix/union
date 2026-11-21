/**
 * UI strings for ru.baptist.org.md. The `Dictionary` type is inferred from this
 * object, so every other locale must have exactly the same keys.
 * Source: docs/SITES-CONFIG.md §2 (legacy `master`).
 *
 * Strings bound to a config entity (site title, header `<h1>`, slider and widget
 * labels, footer columns/links, contacts, address, copyright) live in
 * `src/config/sites.ts` next to their ids (Q12) and are not repeated here.
 */
export const ru = {
  search: {
    placeholder: 'поиск...',
    /** Heading before the highlighted query: `результаты поиска '{query}'`. */
    results: 'результаты поиска',
  },
  card: {
    more: 'далее',
  },
  error: {
    title: 'Ошибка',
    notFound: '404 | Страница не найдена',
    /** Legacy ru showed English "Error occurred!" (SITES-CONFIG §2). */
    fetch: 'Произошла ошибка!',
  },
  a11y: {
    // Legacy aria-labels/alt were English on both sites; localized for screen readers.
    menu: 'Меню',
    closeMenu: 'Закрыть меню',
    search: 'Поиск',
    logo: 'Логотип',
    scrollTop: 'Наверх',
    prevPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
    views: 'Просмотры',
  },
};

export type Dictionary = typeof ru;
