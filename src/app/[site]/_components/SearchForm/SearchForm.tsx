import { GoSearch } from 'react-icons/go';
import { MAX_QUERY_LENGTH } from '@/lib/search/query';
import css from './SearchForm.module.css';

interface SearchFormProps {
  readonly placeholder: string;
  readonly label: string;
}

/** Plain GET form → `/search?q=…`: works without JS, so it is a Server Component. */
export function SearchForm({ placeholder, label }: SearchFormProps) {
  return (
    <div className={css.content}>
      <form className={css.search} action="/search" role="search">
        <input
          type="search"
          name="q"
          className={css.search__input}
          placeholder={placeholder}
          aria-label={label}
          minLength={3}
          maxLength={MAX_QUERY_LENGTH}
          required
        />
        <button type="submit" className={css.search__submit} aria-label={label}>
          <GoSearch size="1.3em" />
        </button>
      </form>
    </div>
  );
}
