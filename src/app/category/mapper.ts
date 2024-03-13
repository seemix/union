import { ICategoryPostResponse, IMappedCategoryPost } from '@/app/category/types';

export const mappedCategoryPosts = (posts: ICategoryPostResponse): IMappedCategoryPost[] => {
    return posts.data.category.posts.edges.map(post => {
        return {
            id: post.node.databaseId,
            title: post.node.title,
            date: post.node.date.split('T')[0].split('-').reverse().join('.'),
            image: post.node.featuredImage?.node.mediaItemUrl,
            excerpt: post.node.excerpt.replace(/<[^>]*>/g, '')
                .replace('&nbsp;', '')
                .replace('&#8220;','"')
                .replace('&#8221;','"')
                .split(/[.!?]/)
                .slice(0, 2)
                .join('. ')
                .split(/\s+/)
                .slice(0, 20).join(' ') + '...'
        };
    });
};