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
import css from './NewsSwiper.module.css';

const NewsSwiper = ({ slides }: { slides: IMappedCategoryPost[] }) => {
    const swiperSettings = {
        speed: 1500,
        spaceBetween: 0,
        slidesPerView: 1,
        autoplay: {
            delay: 6500,
            disableOnInteraction: true,
            pauseOnMouseEnter: true
        },
        effect: 'fade',
        navigation: true,
        fadeEffect: {
            crossFade: true,
        },
        modules: [Autoplay, EffectFade, Navigation, Pagination],
    };
    return (
        <Swiper className={css.slider_wrapper} {...swiperSettings}>
            {
                slides.map(slide => <SwiperSlide key={slide.id} className={css.single_slide}>
                    <Link href={'post?id=' + slide.id}>
                        <div className={'slide_picture'} style={{ backgroundImage: `url(${slide.image})` }}/>
                        <span className={css.label}>Новости братства</span>
                        <h4 className={css.caption}>{slide.title}</h4>
                        <div className={css.excerpt}><p>{slide.excerpt}</p></div>
                    </Link>
                </SwiperSlide>)
            }
        </Swiper>
    );
};

export default NewsSwiper;