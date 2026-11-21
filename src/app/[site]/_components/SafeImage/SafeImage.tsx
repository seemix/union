'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

export const FALLBACK_IMAGE = '/images/fallback.webp';

/**
 * `next/image` with a client-side fallback: when the remote image fails to load
 * (404, network), it is swapped for the local placeholder. Replaces the legacy
 * server-side HEAD check (`MyImage`).
 */
export function SafeImage({ src, alt, onError, ...rest }: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps['src'] | null>(null);
  const failed = failedSrc === src;
  return (
    <Image
      {...rest}
      alt={alt}
      src={failed ? FALLBACK_IMAGE : src}
      unoptimized={failed || rest.unoptimized}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}
