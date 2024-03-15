'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';

import { PaginationButtons } from '@/app/components';
import css from './Pagination.module.css';

const Pagination = ({ pages }: { pages: number }) => {
    let arr: number[] = [];
    for (let i = 1; i <= pages; i++) {
        arr.push(i);
    }
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    let firstPart: number[] = [];
    let secondPart: number[] = [];
    let thirdPart: number[] = [];
    arr.forEach(page => {
        if (currentPage > 3 && page < 3) {
            firstPart.push(page);
        } else if (page - currentPage < 3 && currentPage - page < 3) {
            secondPart.push(page);
        } else if (pages - currentPage > 2 && pages - page < 2) {
            thirdPart.push(page);
        }
    });
    return (
        <>
            <div className={css.pagination_wrapper}>
                <PaginationButtons buttons={firstPart}/>
                {firstPart.length > 0 && secondPart[0] - firstPart[1] > 1 &&
                    <div className={css.dots}/>}
                <PaginationButtons buttons={secondPart}/>
                {thirdPart.length > 0 && thirdPart[0] - +secondPart.slice(-1) > 1 &&
                    <div className={css.dots}/>}
                <PaginationButtons buttons={thirdPart}/>
            </div>
        </>
    );
};

export default Pagination;