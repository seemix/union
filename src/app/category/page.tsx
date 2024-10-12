import React from 'react';
import { Metadata } from 'next';

import { baseURL, siteTitle } from '@/app/assets/common';
import { mappedCategoryPosts } from '@/app/category/mapper';
import { IMappedCategoryPost } from '@/app/category/types';
import { AnimatedComponent, CategoryName, Pagination, PostCard } from '@/app/components';
import { blockAppearAnimation } from '@/app/category/animation';
import { getCategoryName } from '@/app/category/getCategoryName';
import css from './page.module.css';


export const generateMetadata = async ({ searchParams }: { searchParams: { id: string } }): Promise<Metadata> => {
    const category = await getCategoryName(searchParams);
    return {
        title: category + ' | ' + siteTitle
    };
};
const Category = async ({ searchParams }: { searchParams: { id: string, page: string } }) => {
    let queryString = 'posts&categories=' + searchParams.id + '&per_page=8';
    if (searchParams.page) queryString += '&page=' + searchParams.page;
    const response = await fetch(baseURL + queryString, { cache: 'no-cache' });
    let pages = 1;
    let posts: IMappedCategoryPost[];
    if (response.ok) {
        const data = await response.json();
        if (response.headers.get('X-WP-TotalPages')) {
            pages = Number(response.headers.get('X-WP-TotalPages'));
        }
        posts = mappedCategoryPosts(data);
    } else {
        posts = [];
    }
    const category = await getCategoryName(searchParams);
    return (
        <main className={'main'}>
            <CategoryName categoryName={category}/>
            <div className={css.cards_wrapper}>
                {!response.ok && <h1>Error occurred!</h1>}
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