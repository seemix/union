'use client';

import { A11y, Autoplay, EffectFade, Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import type { SwiperOptions } from 'swiper/types';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/a11y';
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

/** Localized screen-reader strings of the carousel (from the dictionary). */
export interface SliderA11y {
  readonly carousel: string;
  readonly slide: string;
  readonly prev: string;
  readonly next: string;
}

export function HomeSlider({
  slides,
  variant,
  label,
  tone,
  a11y,
}: {
  slides: readonly Slide[];
  variant: SliderVariant;
  label: string;
  tone: LabelTone;
  a11y: SliderA11y;
}) {
  if (slides.length === 0) return null;
  return (
    <Swiper
      className={css[variant]}
      modules={[A11y, Autoplay, EffectFade, Keyboard, Navigation]}
      keyboard={{ enabled: true, onlyInViewport: true }}
      a11y={{
        containerMessage: label,
        containerRoleDescriptionMessage: a11y.carousel,
        itemRoleDescriptionMessage: a11y.slide,
        prevSlideMessage: a11y.prev,
        nextSlideMessage: a11y.next,
      }}
      onSwiper={pauseWhileFocused}
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

/** WCAG 2.2.2: auto-rotation must not run while keyboard focus is inside the slider. */
function pauseWhileFocused(swiper: SwiperClass) {
  swiper.el.addEventListener('focusin', () => {
    if (swiper.autoplay?.running) swiper.autoplay.pause();
  });
  swiper.el.addEventListener('focusout', (event) => {
    if (!swiper.el.contains(event.relatedTarget as Node | null) && swiper.autoplay?.paused) {
      swiper.autoplay.resume();
    }
  });
}
