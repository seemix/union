'use client';

import React, { KeyboardEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GoSearch } from 'react-icons/go';

import css from './SearchForm.module.css';

const SearchForm = () => {
    const router = useRouter();
    const searchInput = useRef<HTMLInputElement | null>(null);

    const handleSearch = () => {
        if (searchInput.current?.value && searchInput.current?.value.length > 2) {
            router.push('/search?query=' + searchInput.current?.value);
        }
    };
    const handleInput = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };
    return (
        <div className={css.content}>
            <div className={css.search}>
                <input onKeyDown={handleInput} ref={searchInput} type={'text'} className={css.search__input}
                       placeholder={'поиск...'}/>
                <button onClick={handleSearch} className={css.search__submit} aria-label={'search'}>
                    <GoSearch size={'1.3em'}/>
                </button>
            </div>
        </div>
    );
};

export default SearchForm;