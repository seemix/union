import React from 'react';
import Link from 'next/link';

import { baseURL, siteTitle } from '@/app/assets/common';
import { IRawPost } from '@/app/post/types';
import { imageParser } from '@/app/common/functions/imageParser';
import { contentTransformer } from '@/app/common/functions/contentTransformer';
import { ContentRender, DateViews } from '@/app/components';
import { postMapper } from '@/app/post/mapper';
import { markText } from '@/app/common//functions/markText';

import css from './post.module.css';
import PostViewCounter from '@/app/components/client/PostViewCounter/PostViewCounter';
import { Metadata } from 'next';
import { metaDescriptionTransformer } from '@/app/common/functions/metaDescriptionTransformer';

interface ISearchParams {
    id: string,
    link: string,
    query?: string
}

const getData = async (searchParams: ISearchParams) => {
    const response = await fetch(baseURL + 'posts/' + searchParams.id + '&_embed=wp:term', {
        next: {
            revalidate: 10
        }
    });
    const rawPost: IRawPost = await response.json();
    return postMapper(rawPost);

};

export const generateMetadata = async ({ searchParams }: { searchParams: ISearchParams }): Promise<Metadata> => {
    const post = await getData(searchParams);
    return {
        title: post.title + ' | ' + siteTitle,
        description: metaDescriptionTransformer(post.content),
        openGraph: {
            images: post.fimg_url
        },
    };
};

const Page = async ({ searchParams }: { searchParams: { id: string, link: string, query?: string } }) => {
    const post = await getData(searchParams);
    if (searchParams.query) {
        post.content = markText(post.content, searchParams.query);
    }
    const slides = imageParser(post.content);
    return (
        <div className={'main'}>
            <div className={css.categories_wrapper}>
                {post.categories.map(cat => <Link href={cat.link} key={cat.id}>{cat.name}</Link>)}
            </div>
            <h2>{contentTransformer(post.title)}</h2>
            <DateViews views={post.views} date={post.date}/>
            <ContentRender content={post.content} slides={slides}/>
            <PostViewCounter postId={post.id}/>
        </div>
    );
};

export default Page;