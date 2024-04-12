'use client';

import React, { useRef } from 'react';

import css from './SearchForm.module.css';
import { GoSearch } from 'react-icons/go';
import { useRouter } from 'next/navigation';

const SearchForm = () => {
    const router = useRouter();
    const searchInput = useRef<HTMLInputElement | null>(null);
    const handleSearch = () => {
        if (searchInput.current?.value && searchInput.current?.value.length > 2) {
            router.push('/search?q=' + searchInput.current?.value);
        }
    };
    return (
        <div className={css.content}>
            <div className={css.search}>
                <input ref={searchInput} type={'text'} className={css.search__input} aria-label="search"
                       placeholder="enter your search"/>
                <button onClick={handleSearch} className={css.search__submit} aria-label="submit search">
                    <GoSearch size={'1.3em'}/>
                </button>
            </div>
        </div>
    );
};

export default SearchForm;