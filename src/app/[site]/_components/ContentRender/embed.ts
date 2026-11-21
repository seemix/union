/**
 * Iframe hosts allowed in WP content. Keep in sync with `FRAME_SRC` in `next.config.ts`
 * (the CSP would block anything else anyway; we drop it instead of showing an error box).
 */
export const VIDEO_HOSTS: ReadonlySet<string> = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.facebook.com',
  'web.facebook.com',
]);

/** Players with their own fixed height (audio, file previews): width 100%, no 16:9 box. */
export const OTHER_EMBED_HOSTS: ReadonlySet<string> = new Set([
  'widget.spreaker.com',
  'www.spreaker.com',
  'drive.google.com',
]);

export interface EmbedSrc {
  readonly src: string;
  /** `true` → 16:9 wrapper, `false` → keeps the height from the markup. */
  readonly video: boolean;
}

/** Normalizes an iframe `src` (https only, `//host` → https); `null` → drop the iframe. */
export function resolveEmbed(raw: string | undefined): EmbedSrc | null {
  if (!raw) return null;
  const value = raw.trim().replace(/^\/\//, 'https://');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  const video = VIDEO_HOSTS.has(host);
  if (!video && !OTHER_EMBED_HOSTS.has(host)) return null;
  url.protocol = 'https:';
  return { src: url.toString(), video };
}
