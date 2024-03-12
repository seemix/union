import React from 'react';
import { getData } from '@/app/common/getData';
import { categoryQuery } from '@/app/category/query';
import { ICategoryPostResponse } from '@/app/category/types';
import { mappedCategoryPosts } from '@/app/category/mapper';

const Category = async ({ searchParams }: { searchParams: { id: string } }) => {
    const response: ICategoryPostResponse = await getData(categoryQuery(+searchParams.id));
    const posts = mappedCategoryPosts(response);
    return (
        <div>
            <h1>Category {searchParams.id}</h1>
            {posts && posts.map(post => <h4 key={post.id}>{post.title}</h4>)}
        </div>
    );
};

export default Category;