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
import css from './SmallNewsSwiper.module.css';

const SmallNewsSwiper = ({ slides, caption = '' }: { slides: IMappedCategoryPost[], caption: string }) => {
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
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '4px',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundImage: `url(${slide.image})`
                    }}></div>
                    {/*<img src={slide.image} alt={slide.title} width={'100%'}/>*/}
                    {caption && <span className={css.label}>{caption}</span>}
                    <h4 className={css.caption}>{slide.title}</h4>
                </Link>
            </SwiperSlide>)}
        </Swiper>
    );
};

export default SmallNewsSwiper;