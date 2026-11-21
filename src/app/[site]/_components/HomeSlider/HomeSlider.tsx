'use client';

import { useEffect, useRef, useState } from 'react';
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
  },
  small: {
    speed: 1000,
    autoplay: { delay: 7000 },
  },
};

const HIDDEN = { display: 'none' } as const;

/** Latest moment to start Swiper without any user interaction. */
const INIT_FALLBACK_MS = 5000;

/** Localized screen-reader strings of the carousel (from the dictionary). */
export interface SliderA11y {
  readonly carousel: string;
  readonly slide: string;
  readonly prev: string;
  readonly next: string;
}

/**
 * Slider whose markup is plain React (`.swiper > .swiper-wrapper > .swiper-slide`), so the
 * server HTML already contains the real first slide and its `<img>` is never replaced:
 * Swiper is loaded after mount and only *adopts* this DOM (classes/transforms), which keeps
 * the LCP image out of the JS critical path. (`swiper/react` rendered the slides itself, read
 * `new Date()` — forcing a Suspense boundary and a static stand-in — and swapped the DOM.)
 *
 * Only the first slide's image is rendered at first; the others appear once Swiper is up, so
 * they do not compete with the LCP image for bandwidth. Server and first client render match.
 */
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
  const rootRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || count === 0) return;
    let swiper: SwiperClass | undefined;
    let cancelled = false;

    const start = async () => {
      const [{ default: Swiper }, { A11y, Autoplay, EffectFade, Keyboard, Navigation }] =
        await Promise.all([import('swiper'), import('swiper/modules')]);
      if (cancelled) return;
      swiper = new Swiper(root, {
        modules: [A11y, Autoplay, EffectFade, Keyboard, Navigation],
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: {
          containerMessage: label,
          containerRoleDescriptionMessage: a11y.carousel,
          itemRoleDescriptionMessage: a11y.slide,
          prevSlideMessage: a11y.prev,
          nextSlideMessage: a11y.next,
        },
        effect: 'fade',
        fadeEffect: { crossFade: true },
        slidesPerView: 1,
        spaceBetween: 0,
        navigation:
          variant === 'large' && prevRef.current && nextRef.current
            ? { prevEl: prevRef.current, nextEl: nextRef.current }
            : false,
        ...SETTINGS[variant],
        // A single slide has nothing to rotate to.
        autoplay: count > 1 ? SETTINGS[variant].autoplay : false,
      });
      pauseWhileFocused(swiper);
      setReady(true);
    };

    // Swiper is not needed for the first view, and its ~80 KB of JS would count against
    // LCP/TBT: start it on the first user interaction, or after INIT_FALLBACK_MS at the latest
    // (the first autoplay switch is due after 6.5 s anyway).
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      cleanup();
      void start();
    };
    const events = [
      'pointerdown',
      'pointermove',
      'touchstart',
      'keydown',
      'scroll',
      'wheel',
    ] as const;
    const timer = window.setTimeout(go, INIT_FALLBACK_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, go);
    };
    for (const e of events) window.addEventListener(e, go, { passive: true, once: true });

    return () => {
      cancelled = true;
      cleanup();
      swiper?.destroy(true, true);
      setReady(false);
    };
  }, [count, variant, label, a11y]);

  if (count === 0) return null;
  return (
    <div ref={rootRef} className={`swiper ${css[variant]}`}>
      <div className="swiper-wrapper">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`swiper-slide ${css.slide}`}>
            <SlideContent
              slide={ready || index === 0 ? slide : { ...slide, image: null }}
              variant={variant}
              label={label}
              tone={tone}
              priority={variant === 'large' && index === 0}
            />
          </div>
        ))}
      </div>
      {/* Shown only once Swiper runs: before that the arrows would do nothing. */}
      {variant === 'large' && count > 1 && (
        <>
          <div ref={prevRef} className="swiper-button-prev" style={ready ? undefined : HIDDEN} />
          <div ref={nextRef} className="swiper-button-next" style={ready ? undefined : HIDDEN} />
        </>
      )}
    </div>
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
