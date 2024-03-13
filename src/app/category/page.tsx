import React from 'react';
import { getData } from '@/app/common/getData';
import { categoryQuery } from '@/app/category/query';
import { ICategoryPostResponse } from '@/app/category/types';
import { mappedCategoryPosts } from '@/app/category/mapper';
import PostCard from '@/app/category/components/PostCard';

const Category = async ({ searchParams }: { searchParams: { id: string } }) => {
    const response: ICategoryPostResponse = await getData(categoryQuery(+searchParams.id));
    const posts = mappedCategoryPosts(response);
    return (
        <main className={'main'}>
            <h1>Category {searchParams.id}</h1>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {posts && posts.map(post => <PostCard id={post.id} date={post.date} title={post.title}
                                                      excerpt={post.excerpt} image={post.image} key={post.id}/>)}
            </div>
        </main>
    );
};

export default Category;