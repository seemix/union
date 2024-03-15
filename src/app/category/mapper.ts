import { IMappedCategoryPost } from '@/app/category/types';
import { IRawPost } from '@/app/category/types';
import { contentTransformer } from '@/app/common/functions/contentTransformer';

export const mappedCategoryPosts = (posts: IRawPost[]): IMappedCategoryPost[] => {
    return posts.map(post => {
        return {
            id: post.id,
            title: contentTransformer(post.title.rendered),
            date: post.date.split('T')[0].split('-').reverse().join('.'),
            views: post.views,
            image: post.fimg_url,
            excerpt: contentTransformer(post.excerpt.rendered)
                .replace(/<[^>]*>/g, '')
                .split(/[.!?]/)
                .slice(0, 2)
                .join('. ')
                .split(/\s+/)
                .slice(0, 18).join(' ') + '...'
        }
    })
}