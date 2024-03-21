import React from 'react';
import { IoMdEye } from 'react-icons/io';

import css from './DateViews.module.css';

const DateViews = ({ views, date }: { views: number, date: string }) => {
    return (
        <div className={css.date_wrapper}>
            <div className={css.views_wrapper}>
                <IoMdEye/>
                <p><small>{views}</small></p>
            </div>
            <div className={css.card_date}>{date}</div>
        </div>
    );
};

export default DateViews;