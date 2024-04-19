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

import Image from 'next/image';
import { IMappedCategoryPost } from '@/app/category/types';
import { Label } from '@/app/components';
import { blurDataUrl } from '@/app/assets/common';
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
        lazyLoad: true,
        modules: [Autoplay, EffectFade, Navigation, Pagination],
    };
    return (
        <Swiper className={css.slider_wrapper} {...swiperSettings} >
            {slides.map(slide => <SwiperSlide key={slide.id} className={css.single_slide}>
                <Link href={'post?id=' + slide.id}>
                    <div className={'slide_picture'}>
                        <Image src={slide.image as string} alt={slide.image as string} fill
                               style={{ objectFit: 'cover', objectPosition: 'center' }}
                               className={'swiper-lazy'}
                               placeholder={'blur'}
                               blurDataURL={blurDataUrl}
                               sizes={'(max-width: 1920px) 30vw (max-width: 600px) 60vw'}/>
                    </div>
                    {caption && <Label text={caption} size={'small'} color={color}/>}
                    <h4 className={css.caption}>{slide.title}</h4>
                </Link>
            </SwiperSlide>)}
        </Swiper>
    );
};

export default SmallNewsSwiper;