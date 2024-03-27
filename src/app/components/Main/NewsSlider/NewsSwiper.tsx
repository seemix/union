'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { IMappedCategoryPost } from '@/app/category/types';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
// import 'swiper/css';
import 'swiper/css/effect-fade';
// import 'swiper/css/navigation';
import 'swiper/css/pagination';
import css from './NewsSwiper.module.css';
import Link from 'next/link';

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
//        pauseOnMouseEnter: true,
        effect: 'fade',

        fadeEffect: {
            crossFade: true,
        },
        //  pagination: {
        //    clickable: true,
        // },
        modules: [Autoplay, EffectFade, Navigation, Pagination],
        // loop: true
    };
    return (
        <Swiper className={css.slider_wrapper} {...swiperSettings}>
            {
                slides.map(slide => <SwiperSlide key={slide.id} className={css.single_slide}>
                    <Link href={'post?id=' + slide.id}>
                        <Image src={String(slide.image)} alt={String(slide.image)} width={773} height={400}/>
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