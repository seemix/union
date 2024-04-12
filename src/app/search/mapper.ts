import { IRawSearchResult } from '@/app/search/types';
import { contentTransformer, dateTransformer } from '@/app/common';

export const mappedSearchResults = (searchResults: IRawSearchResult[])  => {
    return searchResults.map(item => {
        return {
            id: item.id,
            title: contentTransformer(item.title),
            subtype: item.subtype,
            date: dateTransformer(item._embedded.self[0].date),
            image: item._embedded.self[0].fimg_url,
            views: item._embedded.self[0].views,
            excerpt: contentTransformer(item._embedded.self[0].excerpt.rendered)
                .replace(/<[^>]*>/g, '')
                .split(/[.!?]/)
                .slice(0, 2)
                .join('. ')
                .split(/\s+/)
                .slice(0, 18).join(' ') + '...'
        };
    });
};