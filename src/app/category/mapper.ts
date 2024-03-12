import { ICategoryPostResponse, IMappedCategoryPost } from '@/app/category/types';

export const mappedCategoryPosts = (posts: ICategoryPostResponse): IMappedCategoryPost[] => {
    return posts.data.category.posts.edges.map(post => {
        return {
            id: post.node.databaseId,
            title: post.node.title,
            date: post.node.date,
            image: post.node.featuredImage.node.mediaItemUrl,
            excerpt: post.node.excerpt
        };
    });
};