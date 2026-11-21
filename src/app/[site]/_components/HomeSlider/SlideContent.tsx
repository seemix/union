import { SafeImage } from '../SafeImage/SafeImage';
import Link from 'next/link';
import { Label, type LabelTone } from '../Label/Label';
import css from './HomeSlider.module.css';

export interface Slide {
  readonly id: number;
  readonly href: string;
  readonly title: string;
  /** Empty = no excerpt overlay. */
  readonly excerpt: string;
  readonly image: { readonly src: string; readonly alt: string } | null;
}

export type SliderVariant = 'large' | 'small';

const SIZES = {
  large: '(max-width: 1100px) 100vw, 700px',
  small: '(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 350px',
} as const;

/** Markup of one slide: server HTML that Swiper adopts on the client (see `HomeSlider`). */
export function SlideContent({
  slide,
  variant,
  label,
  tone,
  priority = false,
}: {
  slide: Slide;
  variant: SliderVariant;
  label: string;
  tone: LabelTone;
  priority?: boolean;
}) {
  const Heading = variant === 'large' ? 'h2' : 'h4';
  return (
    <Link href={slide.href}>
      <div className="slide_picture">
        {slide.image && (
          <SafeImage
            src={slide.image.src}
            alt={slide.image.alt || slide.title}
            fill
            priority={priority}
            fetchPriority={priority ? 'high' : undefined}
            sizes={SIZES[variant]}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        )}
      </div>
      <Label text={label} size={variant === 'large' ? 'big' : 'small'} tone={tone} />
      <Heading className={css.caption}>{slide.title}</Heading>
      {slide.excerpt && (
        <div className={css.excerpt}>
          <p>{slide.excerpt}</p>
        </div>
      )}
    </Link>
  );
}
