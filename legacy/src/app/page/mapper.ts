import { IMappedPage, IRawPage } from '@/app/page/types';
import { contentTransformer } from '@/app/common';

export const pageMapper = (page: IRawPage): IMappedPage => {
    return {
        id: page.id,
        title: page.title.rendered,
        content: contentTransformer(page.content.rendered)
    };
};