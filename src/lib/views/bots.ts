/**
 * Crawlers, link previewers, monitoring and scripted clients. Real browsers never match.
 * Broad on purpose (a missed human view costs little, a counted bot inflates numbers), but
 * without app names whose in-app browsers are real readers (Telegram, Yandex, Baidu…):
 * their preview fetchers already match `bot` / `spider`.
 */
const BOT_UA = new RegExp(
  [
    'bot\\b',
    'bot/',
    'crawl',
    'spider',
    'slurp',
    'archiver',
    'scrap',
    'fetch',
    'preview',
    'monitor',
    'uptime',
    'pingdom',
    'lighthouse',
    'pagespeed',
    'headless',
    'phantomjs',
    'puppeteer',
    'playwright',
    'selenium',
    'facebookexternalhit',
    'facebookcatalog',
    'meta-externalagent',
    'whatsapp',
    'vkshare',
    'embedly',
    'mediapartners',
    'adsbot',
    'google-inspectiontool',
    'feedfetcher',
    'curl',
    'wget',
    'python',
    'httpx',
    'aiohttp',
    'java/',
    'okhttp',
    'go-http-client',
    'node-fetch',
    'undici',
    'axios',
    'libwww',
    'perl',
    'ruby',
    'php/',
    'postman',
    'insomnia',
    '^mozilla/5\\.0$',
  ].join('|'),
  'i',
);

/** `true` for an empty/absent User-Agent or a known non-human client. */
export function isBot(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim();
  if (!ua) return true;
  return BOT_UA.test(ua);
}

/** Browser prefetch / prerender requests (`Sec-Purpose: prefetch`, legacy `Purpose`). */
export function isPrefetch(headers: Headers): boolean {
  const purpose = `${headers.get('sec-purpose') ?? ''} ${headers.get('purpose') ?? ''}`;
  return /prefetch|prerender/i.test(purpose);
}
