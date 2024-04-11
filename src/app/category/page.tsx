import React from 'react';

import { baseURL } from '@/app/assets/common';
import { mappedCategoryPosts } from '@/app/category/mapper';
import { IMappedCategoryPost } from '@/app/category/types';
import { AnimatedComponent, Pagination } from '@/app/components';
import { CategoryName, PostCard } from '@/app/category/components';
import { blockAppearAnimation } from '@/app/category/animation';
import css from './page.module.css';

const Category = async ({ searchParams }: { searchParams: { id: string, page: string } }) => {
    let queryString = 'posts&categories=' + searchParams.id + '&per_page=8';
    if (searchParams.page) queryString += '&page=' + searchParams.page;
    const resp = await fetch(baseURL + queryString, {
        method: 'GET'
    });
    let pages = 1;
    let posts: IMappedCategoryPost[];
    if (resp.ok) {
        const data = await resp.json();
        if (resp.headers.get('X-WP-TotalPages')) {
            pages = Number(resp.headers.get('X-WP-TotalPages'));
        }
        posts = mappedCategoryPosts(data);
    } else {
        posts = [];
    }

    return (
        <main className={'main'}>
            <CategoryName id={searchParams.id}/>
            <div className={css.cards_wrapper}>
                {!resp.ok && <h1>33333</h1>}
                {posts.length > 0 && posts.map(post =>
                    <AnimatedComponent
                        key={post.id}
                        animation={blockAppearAnimation}>
                        <PostCard
                            id={post.id}
                            date={post.date}
                            title={post.title}
                            views={post.views}
                            excerpt={post.excerpt}
                            image={post.image}
                            key={post.id}/>
                    </AnimatedComponent>)}
            </div>
            <Pagination pages={pages}/>
        </main>
    );
};

export default Category;