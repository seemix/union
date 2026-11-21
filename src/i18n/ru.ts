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
    noResults: 'Ничего не найдено',
    enterQuery: 'Введите запрос для поиска',
  },
  card: {
    more: 'далее',
  },
  pagination: {
    /** Title suffix of list pages after the first: `{category} — Страница 2`. */
    page: 'Страница',
  },
  error: {
    title: 'Ошибка',
    notFound: '404 | Страница не найдена',
    /** Legacy ru showed English "Error occurred!" (SITES-CONFIG §2). */
    fetch: 'Произошла ошибка!',
    notFoundHint: 'Возможно, страница была удалена или адрес введён неверно. Попробуйте поиск:',
    retry: 'Попробовать снова',
    backHome: 'На главную',
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
    pagination: 'Страницы',
    views: 'Просмотры',
    loading: 'Загрузка',
  },
};

export type Dictionary = typeof ru;
