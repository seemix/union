import React from 'react';

import { IoMdEye } from 'react-icons/io';
import { IMappedCategoryPost } from '@/app/category/types';
import css from './PostCard.module.css';

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
                <div className={css.date_wrapper}>
                    <div className={css.views_wrapper}>
                        <IoMdEye/>
                        <p><small>{post.views}</small></p>
                    </div>
                    <h4 className={css.card_date}>{post.date}</h4>
                </div>
                <div>
                    <h3 className={post.title.length > 60 ? css.card_caption + ' ' + css.cc_smaller : css.card_caption}>
                        {post.title}
                    </h3>
                    <div className={css.excerpt}>
                        <p>{post.excerpt}</p>
                    </div>
                </div>
                <div className={css.button_wrapper}>
                    <button>далее</button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;