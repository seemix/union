import { IMappedCategoryPost } from '@/app/category/types';
import { IRawPost } from '@/app/category/types';
import { contentTransformer } from '@/app/common/functions/contentTransformer';
import { dateTransformer } from '@/app/common';

export const mappedCategoryPosts = (posts: IRawPost[], excerptLength = 18): IMappedCategoryPost[] => {
    return posts.map(post => {
        return {
            id: post.id,
            title: contentTransformer(post.title.rendered),
            date: dateTransformer(post.date),
            views: post.views,
            image: post.fimg_url,
                //.replace(/\.(\w+)$/, '-520x260.$1'),
            excerpt: contentTransformer(post.excerpt.rendered)
                .replace(/<[^>]*>/g, '')
                .split(/[.!?]/)
                .slice(0, 2)
                .join('. ')
                .split(/\s+/)
                .slice(0, excerptLength).join(' ') + '...'
        };
    });
};