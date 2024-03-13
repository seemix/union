import React from 'react';

import css from './PostCard.module.css';
import { IMappedCategoryPost } from '@/app/category/types';

const PostCard = (post: IMappedCategoryPost) => {
    return (
        <div className={css.card}>
            <div className={css.card_picture} style={{ backgroundImage: `url(${post.image})` }}>
            </div>
            <div className={css.picture_overlay}>
                <h3>{post.title}</h3>
            </div>
            {/*<img src={post.image} alt={post.title} className={css.card_picture}/>*/}
            <div className={css.card_bottom}>
                <h4 className={css.card_date}>{post.date}</h4>
                <br/>
                <h3 className={post.title.length > 60 ? css.card_caption + ' ' + css.cc_smaller : css.card_caption}>{post.title}</h3>
                <div className={css.exc}>
                    <p>{post.excerpt}</p>
                </div>
                <div className={css.button_wrapper}>
                    <button className={css.button}>читать</button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;