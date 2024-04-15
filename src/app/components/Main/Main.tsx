import React from 'react';

import { SmallNewsSwiper } from '@/app/components';
import { getSlides } from '@/app/components/Main/getSlides';
import NewsSwiper from '@/app/components/Main/NewsSlider/client/NewsSwiper';
import BottomWidgets from '@/app/components/Main/BottomWidgets/BottomWidgets';
import css from './Main.module.css';

const Main = async () => {
    const news = await getSlides(17, 5, 50);
    const newsInWorld = await getSlides(27, 5, 0);
    const prayerRelay = await getSlides(203, 1, 0);
    return (
        <div>
        <div className={css.main_container}>
            <div className={css.big}>
                <NewsSwiper slides={news}/>
            </div>
            <div className={css.small1}>
                <SmallNewsSwiper slides={newsInWorld} caption={'Христиане в мире'}/>
            </div>
            <div className={css.small2}>
                <SmallNewsSwiper slides={prayerRelay} caption={''}/>
                {/*<img src="" alt="glgf" width={'100%'}/>*/}
            </div>
        </div>
            <BottomWidgets />
        </div>
    );
};

export default Main;