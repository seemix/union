import React from 'react';
import Link from 'next/link';

import { IMappedCategoryPost } from '@/app/category/types';
import { DateViews } from '@/app/components';
import css from './PostCard.module.css';

const PostCard = (post: IMappedCategoryPost) => {
    return (
        <div className={css.card}>
            <div className={css.card_picture} style={{ backgroundImage: `url(${post.image})` }}/>
            <div className={css.picture_overlay}>
                <h3>{post.title}</h3>
            </div>
            {/*<img src={post.image} alt={post.title} className={css.card_picture}/>*/}
            <div className={css.card_bottom}>
                <DateViews views={post.views} date={post.date}/>
                <div className={css.bottom_content}>
                    <Link href={{ pathname: 'post', query: { id: String(post.id) } }}>
                        <h3 className={post.title.length > 60 ? css.card_caption + ' ' + css.cc_smaller : css.card_caption}>
                            {post.title}
                        </h3>
                    </Link>
                    <div className={css.excerpt}>
                        <p>{post.excerpt}</p>
                    </div>
                </div>
                <div className={css.button_wrapper}>
                    <Link href={{ pathname: 'post', query: { id: String(post.id) } }}>
                        <button className={css.more_button}>далее</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PostCard;