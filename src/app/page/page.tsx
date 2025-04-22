import React from 'react';
import { Metadata } from 'next';

import { baseURL, siteTitle } from '@/app/assets/common';
import { ContentRender } from '@/app/components';
import { contentTransformer, imageParser } from '@/app/common';
import { pageMapper } from '@/app/page/mapper';
import { IRawPost } from '@/app/post/types';
import { metaDescriptionTransformer } from '@/app/common/functions/metaDescriptionTransformer';

interface ISearchParams {
    id: string,
    link: string,
    query?: string
}

const getData = async (searchParams: ISearchParams) => {
    const response = await fetch(baseURL + 'pages/' + searchParams.id, {
        next: {
            revalidate: 10
        }
    });
    const rawPost: IRawPost = await response.json();
    return pageMapper(rawPost);

};

export const generateMetadata = async ({ searchParams }: { searchParams: ISearchParams }): Promise<Metadata> => {
    const page = await getData(searchParams);
    return {
        title: page.title + ' | ' + siteTitle,
        description: metaDescriptionTransformer(page.content)
    };
};

const Page = async ({ searchParams }: { searchParams: ISearchParams }) => {
    const page = await getData(searchParams);
    const slides = imageParser(page.content);
    return (
        <div className={'main'}>
            <h2>{contentTransformer(page.title)}</h2>
            <ContentRender content={page.content} slides={slides}/>
        </div>
    );
};

export default Page;