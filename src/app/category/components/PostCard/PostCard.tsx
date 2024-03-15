import React from 'react';
import Link from 'next/link';
import { IoMdEye } from 'react-icons/io';

import { IMappedCategoryPost } from '@/app/category/types';
import css from './PostCard.module.css';

const PostCard = (post: IMappedCategoryPost) => {
    return (
        <div className={css.card}>
            <div className={css.card_picture} style={{ backgroundImage: `url(${post.image})` }}/>
            {/*<Link href={{ pathname: 'post', query: { id: String(post.id) } }}>*/}
                <div className={css.picture_overlay}>
                    <h3>{post.title}</h3>
                </div>
            {/*</Link>*/}
            {/*<img src={post.image} alt={post.title} className={css.card_picture}/>*/}
            <div className={css.card_bottom}>
                <div className={css.date_wrapper}>
                    <div className={css.views_wrapper}>
                        <IoMdEye/>
                        <p><small>{post.views}</small></p>
                    </div>
                    <h4 className={css.card_date}>{post.date}</h4>
                </div>
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
                        <button>далее</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PostCard;