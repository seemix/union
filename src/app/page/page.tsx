import React from 'react';
import { baseURL } from '@/app/assets/common';
import { ContentRender } from '@/app/components';
import { contentTransformer, imageParser } from '@/app/common';
import { pageMapper } from '@/app/page/mapper';

const Page = async ({ searchParams }: { searchParams: { id: string } }) => {
    const response = await fetch(baseURL + 'pages/' + searchParams.id);
    const rawPage = await response.json();
    const page = pageMapper(rawPage);
    const slides = imageParser(page.content);
    return (
        <div className={'main'}>
            <h2>{contentTransformer(page.title)}</h2>
            <ContentRender content={page.content} slides={slides}/>
        </div>
    );
};

export default Page;