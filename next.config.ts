import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Embeds found in WP post content (scanned in ru + ro posts):
 * YouTube (by far the most), Spreaker, Vimeo, Google Drive. Facebook is allowed
 * per the task (social plugins), although no Facebook iframes occur in current content.
 */
const FRAME_SRC = [
  "'self'",
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
  'https://www.facebook.com',
  'https://web.facebook.com',
  'https://widget.spreaker.com',
  'https://www.spreaker.com',
  'https://drive.google.com',
];

// Static CSP (no nonces): nonces would force every page to dynamic rendering and
// defeat Cache Components. Next's inline bootstrap scripts need 'unsafe-inline'.
// See node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md ("Without Nonces").
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://baptist.org.md",
  "font-src 'self' data:",
  "media-src 'self' https://baptist.org.md",
  "connect-src 'self'",
  `frame-src ${FRAME_SRC.join(' ')}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const config: NextConfig = {
  reactStrictMode: true,

  // cPanel "Setup Node.js App" / Passenger (Q1): self-contained .next/standalone/server.js.
  output: 'standalone',

  // Next 16: component-level caching via `use cache`; PPR is the default behaviour.
  // `partialPrefetching` must be set explicitly alongside it (see docs: cacheComponents).
  cacheComponents: true,
  partialPrefetching: true,

  images: {
    // Only the WP media host. Third-party images that appear in old posts
    // (wixstatic, fbcdn, wp.com, …) are intentionally not optimized.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'baptist.org.md',
        pathname: '/**',
      },
    ],
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // Legacy equivalent of CSP frame-ancestors.
          { key: 'X-Frame-Options', value: 'DENY' },
          ...(isDev
            ? []
            : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default config;
