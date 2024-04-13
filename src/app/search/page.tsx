import React from 'react';
import { baseURL } from '@/app/assets/common';
import { mappedSearchResults } from '@/app/search/mapper';
import { IMappedCategoryPost } from '@/app/search/types';
import { AnimatedComponent, Pagination, PostCard } from '@/app/components';
import { blockAppearAnimation } from '@/app/category/animation';
import css from './page.module.css';

const Search = async ({ searchParams }: { searchParams: { q: string, page: string } }) => {
    let queryString = 'search&_embed=self&search=' + searchParams.q + '&per_page=8';
    if (searchParams.page) queryString += '&page=' + searchParams.page;
    const response = await fetch(baseURL + queryString);
    const pages = Number(response.headers.get('X-WP-TotalPages'));
    const data = await response.json();
    const posts: IMappedCategoryPost[] = mappedSearchResults(data);
    return (
        <div className={'main'}>
            <h2>результаты поиска  <span className={css.red_text}> '{searchParams.q}' </span></h2>
            <div className={css.cards_wrapper}>
                {posts.length > 0 && posts.map(post =>
                    <AnimatedComponent
                        key={post.id}
                        animation={blockAppearAnimation}>
                        <PostCard
                            id={post.id}
                            date={post.date}
                            title={post.title}
                            subtype={post.subtype}
                            views={post.views}
                            excerpt={post.excerpt}
                            image={post.image}
                            key={post.id}/>
                    </AnimatedComponent>)}
            </div>
            <Pagination pages={pages}/>
        </div>
    );
};

export default Search;