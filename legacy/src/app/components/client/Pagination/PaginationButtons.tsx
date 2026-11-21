'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

import css from './Pagination.module.css';

const PaginationButtons = ({ buttons }: { buttons: number[] }) => {
    const router = useRouter();
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    const params = new URLSearchParams(searchParams.toString());
    const goToPage = (page: number) => {
        params.set('page', page.toString());
        router.push(`${pathName}?${params.toString()}`);
    };
    return (
        <>
            {buttons.map(page =>
                <button disabled={page === currentPage}
                        className={page === currentPage ? css.pagination + ' ' + css.active : css.pagination}
                        onClick={() => goToPage(page)}
                        key={page}>{page}</button>
            )}
        </>
    );
};

export default PaginationButtons;