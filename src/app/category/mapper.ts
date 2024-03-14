import { IMappedCategoryPost } from '@/app/category/types';
import { IRawPost } from '@/app/category/types';

export const mappedCategoryPosts = (posts: IRawPost[]): IMappedCategoryPost[] => {
    return posts.map(post => {
        return {
            id: post.id,
            title: post.title.rendered
                .replace('&#8220;','"')
                .replace('&#8211;','|')
                .replace('&#8221;','"'),
            date: post.date.split('T')[0].split('-').reverse().join('.'),
            views: post.views,
            image: post.fimg_url,
            excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '')
                .replace('&nbsp;', '')
                .replace('&#8220;','"')
                .replace('&#8221;','"')
                .split(/[.!?]/)
                .slice(0, 2)
                .join('. ')
                .split(/\s+/)
                .slice(0, 18).join(' ') + '...'
        }
    })
}