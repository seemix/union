import React from 'react';
import { Parser } from 'html-to-react';

import { baseURL } from '@/app/assets/common';
import { IPost } from '@/app/post/types';
import css from './post.module.css';
import { imageParser } from '@/app/common/functions/imageParser';
import { contentTransformer } from '@/app/common/functions/contentTransformer';

const Page = async ({ searchParams }: { searchParams: { id: string } }) => {
    const response = await fetch(baseURL + 'posts/' + searchParams.id);
    const post: IPost = await response.json();
   // const images = imageParser(post.content.rendered);
    return (
        <div className={'main'}>
            <h2>{contentTransformer(post.title.rendered)}</h2>
            <div className={css.post_content}>
                {Parser().parse(post.content.rendered)}
                {/*{bodyText}*/}
            </div>
        </div>
    );
};

export default Page;