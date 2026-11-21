'use client';

import Lightbox from 'yet-another-react-lightbox';
import { Slideshow, Thumbnails, Zoom } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/styles.css';
import type { ContentSlide } from './parse-content';

export default function LightboxView({
  slides,
  index,
  onClose,
}: {
  slides: readonly ContentSlide[];
  index: number;
  onClose: () => void;
}) {
  return (
    <Lightbox
      open
      index={index}
      close={onClose}
      slides={[...slides]}
      plugins={[Slideshow, Zoom, Thumbnails]}
    />
  );
}
