'use client';

import { Autoplay, EffectFade, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SwiperOptions } from 'swiper/types';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import type { LabelTone } from '../Label/Label';
import css from './HomeSlider.module.css';
import { SlideContent, type Slide, type SliderVariant } from './SlideContent';

// Timings and behaviour as in the legacy site.
const SETTINGS: Readonly<Record<SliderVariant, SwiperOptions>> = {
  large: {
    speed: 1500,
    autoplay: { delay: 6500, disableOnInteraction: true, pauseOnMouseEnter: true },
    navigation: true,
  },
  small: {
    speed: 1000,
    autoplay: { delay: 7000 },
  },
};

export function HomeSlider({
  slides,
  variant,
  label,
  tone,
}: {
  slides: readonly Slide[];
  variant: SliderVariant;
  label: string;
  tone: LabelTone;
}) {
  if (slides.length === 0) return null;
  return (
    <Swiper
      className={css[variant]}
      modules={[Autoplay, EffectFade, Navigation]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      slidesPerView={1}
      spaceBetween={0}
      {...SETTINGS[variant]}
      // A single slide has nothing to rotate to.
      autoplay={slides.length > 1 ? SETTINGS[variant].autoplay : false}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={slide.id} className={css.slide}>
          <SlideContent
            slide={slide}
            variant={variant}
            label={label}
            tone={tone}
            priority={variant === 'large' && index === 0}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
