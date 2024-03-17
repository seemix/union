import React from 'react';
import { Parser } from 'html-to-react';
import Link from 'next/link';

import { baseURL } from '@/app/assets/common';
import { IRawPost } from '@/app/post/types';
import { imageParser } from '@/app/common/functions/imageParser';
import { contentTransformer, imageLinkTransformer } from '@/app/common/functions/contentTransformer';
import { DateViews } from '@/app/components';
import { postMapper } from '@/app/post/mapper';
import LightBox from '@/app/components/client/LightBox/LightBox';
import css from './post.module.css';

const Page = async ({ searchParams }: { searchParams: { id: string, link: string } }) => {
    const response = await fetch(baseURL + 'posts/' + searchParams.id + '&_embed=wp:term');
    const rawPost: IRawPost = await response.json();
    const post = postMapper(rawPost);
    const slides = imageParser(post.content);
    const content = imageLinkTransformer(post.content, `post/?id=${post.id}`);
    return (
        <div className={'main'}>
            <LightBox slides={slides}/>
            <div className={css.categories_wrapper}>
                {post.categories.map(cat => <Link href={cat.link} key={cat.id}>{cat.name}</Link>)}
            </div>
            <h2>{contentTransformer(post.title)}</h2>
            <DateViews views={post.views} date={post.date}/>
            {/*<img src={post.fimg_url} width={'100%'} alt={post.title}/>*/}
            {/*<br/>*/}
            <div className={css.post_content}>
                {Parser().parse(content)}
                {/*{bodyText}*/}
            </div>
        </div>
    );
};

export default Page;