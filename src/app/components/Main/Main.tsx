import React from 'react';

import { BottomWidgets, NewsSwiper, SmallNewsSwiper } from '@/app/components';
import { getSlides } from '@/app/components/Main/getSlides';
import css from './Main.module.css';

const Main = async () => {
    const news = await getSlides(23, 5, 50);
    const newsInWorld = await getSlides(22, 5, 0);
    const prayerRelay = await getSlides(514, 3, 0);
    return (
        <div className={css.main_wrapper}>
            <div className={css.main_container}>
                <div className={css.big}>
                    <NewsSwiper slides={news}/>
                </div>
                    <div className={css.small1}>
                        <SmallNewsSwiper slides={newsInWorld} caption={'ŞTIRI EXTERNE'} color={'green'}/>
                    </div>
                    <div className={css.small2}>
                        <SmallNewsSwiper slides={prayerRelay} caption={'ÎNTREBĂRI ŞI RĂSPUNSURI'} color={'red'}/>
                    </div>
            </div>
            <BottomWidgets/>
        </div>
    );
};

export default Main;