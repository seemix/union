'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
// import 'swiper/css';
import 'swiper/css/effect-fade';
// import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { IMappedCategoryPost } from '@/app/category/types';
import { Label } from '@/app/components';
import css from './SmallNewsSwiper.module.css';

const SmallNewsSwiper = ({ slides, caption = '', color = 'red' }: {
    slides: IMappedCategoryPost[],
    caption: string,
    color: string
}) => {
    const swiperSettings = {
        speed: 1000,
        slidesPerView: 1,
        autoplay: {
            delay: 7000,
        },
        effect: 'fade',
        modules: [Autoplay, EffectFade, Navigation, Pagination],
    };
    return (
        <Swiper className={css.slider_wrapper} {...swiperSettings} >
            {slides.map(slide => <SwiperSlide key={slide.id} className={css.single_slide}>
                <Link href={'post?id=' + slide.id}>
                    {/*<MyImage img={slide.image as string}/>*/}
                    <div className={'slide_picture'} style={{ backgroundImage: `url(${slide.image})` }}/>
                    {caption && <Label text={caption} size={'small'} color={color}/>}
                    <h4 className={css.caption}>{slide.title}</h4>
                </Link>
            </SwiperSlide>)}
        </Swiper>
    );
};

export default SmallNewsSwiper;