import { Suspense } from 'react';
import type { LabelTone } from '../Label/Label';
import { HomeSlider } from './HomeSlider';
import { StaticSlider, type Slide, type SliderVariant } from './SlideContent';

/** Slider that is prerendered as its first slide and upgrades to Swiper when it streams in. */
export function HomeSliderSection(props: {
  slides: readonly Slide[];
  variant: SliderVariant;
  label: string;
  tone: LabelTone;
}) {
  return (
    <Suspense fallback={<StaticSlider {...props} />}>
      <HomeSlider {...props} />
    </Suspense>
  );
}
