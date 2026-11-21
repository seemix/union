import { Suspense } from 'react';
import type { LabelTone } from '../Label/Label';
import { HomeSlider, type SliderA11y } from './HomeSlider';
import { StaticSlider, type Slide, type SliderVariant } from './SlideContent';

/** Slider that is prerendered as its first slide and upgrades to Swiper when it streams in. */
export function HomeSliderSection({
  a11y,
  ...props
}: {
  slides: readonly Slide[];
  variant: SliderVariant;
  label: string;
  tone: LabelTone;
  a11y: SliderA11y;
}) {
  return (
    <Suspense fallback={<StaticSlider {...props} />}>
      <HomeSlider {...props} a11y={a11y} />
    </Suspense>
  );
}
