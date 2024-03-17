import { IMappedPost, IRawPost } from '@/app/post/types';
import { contentTransformer, dateTransformer } from '@/app/common';

export const postMapper = (post: IRawPost): IMappedPost => {
    return {
        id: post.id,
        title: post.title.rendered,
        content: contentTransformer(post.content.rendered),
        date: dateTransformer(post.date),
        views: post.views,
        fimg_url: post.fimg_url,
        categories: post._embedded['wp:term'][0].map(item => {
            return {
                id: item.id,
                link: 'category/?id=' + item.link.split('=')[1],
                name: item.name
            };
        })
    };
};