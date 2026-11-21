'use client';

import dynamic from 'next/dynamic';
import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import type { ContentSlide } from './parse-content';

// Lightbox code (and its CSS) loads on first open only.
const LightboxView = dynamic(() => import('./LightboxView'), { ssr: false });

function indexOf(target: EventTarget): number | null {
  const el = (target as Element).closest?.('[data-lightbox-index]');
  const n = el ? Number(el.getAttribute('data-lightbox-index')) : NaN;
  return Number.isInteger(n) ? n : null;
}

/**
 * Wraps server-rendered content; one delegated handler opens the lightbox for every
 * `<img data-lightbox-index>` (single photos and galleries alike, as in legacy).
 */
export function ContentLightbox({
  slides,
  className,
  children,
}: {
  slides: readonly ContentSlide[];
  className?: string;
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);

  function open(e: MouseEvent | KeyboardEvent) {
    const i = indexOf(e.target);
    if (i === null || i >= slides.length) return;
    e.preventDefault(); // an `<a href=image>` around the photo must not navigate
    setIndex(i);
  }

  return (
    <div
      className={className}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') open(e);
      }}
    >
      {children}
      {index !== null && (
        <LightboxView slides={slides} index={index} onClose={() => setIndex(null)} />
      )}
    </div>
  );
}
