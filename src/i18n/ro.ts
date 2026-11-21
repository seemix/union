import type { Dictionary } from './ru';

/**
 * UI strings for ro.baptist.org.md. Typed as `Dictionary`: a missing or extra
 * key is a TS error. Source: docs/SITES-CONFIG.md §2 (legacy `romana`).
 */
export const ro: Dictionary = {
  search: {
    placeholder: 'căutare...',
    // Legacy bug: Russian "результаты поиска".
    results: 'rezultatele căutării',
    noResults: 'Nu s-a găsit nimic',
    enterQuery: 'Introduceți un termen de căutare',
  },
  breadcrumb: {
    /** First item of BreadcrumbList JSON-LD. */
    home: 'Acasă',
  },
  card: {
    more: 'mai mult',
  },
  pagination: {
    page: 'Pagina',
  },
  error: {
    // Legacy bug: Russian "Ошибка" / "404 | Страница не найдена".
    title: 'Eroare',
    notFound: '404 | Pagina nu a fost găsită',
    // Legacy bug: placeholder "33333".
    fetch: 'A apărut o eroare!',
    retry: 'Încearcă din nou',
    backHome: 'Pagina principală',
  },
  a11y: {
    menu: 'Meniu',
    closeMenu: 'Închide meniul',
    search: 'Căutare',
    logo: 'Logo',
    scrollTop: 'Sus',
    prevPage: 'Pagina anterioară',
    nextPage: 'Pagina următoare',
    pagination: 'Paginare',
    views: 'Vizualizări',
    loading: 'Se încarcă',
    skipToContent: 'Sari la conținut',
    mainMenu: 'Meniu principal',
    page: 'Pagina',
    carousel: 'carusel',
    slide: 'diapozitiv',
    prevSlide: 'Diapozitivul anterior',
    nextSlide: 'Diapozitivul următor',
    embed: 'Conținut încorporat',
  },
};
