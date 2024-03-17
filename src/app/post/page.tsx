import React from 'react';
import Link from 'next/link';

import { baseURL } from '@/app/assets/common';
import { IRawPost } from '@/app/post/types';
import { imageParser } from '@/app/common/functions/imageParser';
import { contentTransformer} from '@/app/common/functions/contentTransformer';
import { ContentRender, DateViews } from '@/app/components';
import { postMapper } from '@/app/post/mapper';
import css from './post.module.css';

const Page = async ({ searchParams }: { searchParams: { id: string, link: string } }) => {
    const response = await fetch(baseURL + 'posts/' + searchParams.id + '&_embed=wp:term');
    const rawPost: IRawPost = await response.json();
    const post = postMapper(rawPost);
    const slides = imageParser(post.content);
    return (
        <div className={'main'}>
            <div className={css.categories_wrapper}>
                {post.categories.map(cat => <Link href={cat.link} key={cat.id}>{cat.name}</Link>)}
            </div>
            <h2>{contentTransformer(post.title)}</h2>
            <DateViews views={post.views} date={post.date}/>
            <ContentRender content={post.content} slides={slides}/>
        </div>
    );
};

export default Page;