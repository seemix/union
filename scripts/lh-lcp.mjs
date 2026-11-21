// Debug helper: observed vs simulated LCP and the LCP element. `node scripts/lh-lcp.mjs <url> [v2]`
import lighthouse from 'lighthouse';
import * as cl from 'chrome-launcher';
import path from 'node:path';
import fs from 'node:fs';
const [url, v2] = process.argv.slice(2);
const base = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
const dir = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const chrome = await cl.launch({ chromePath: path.join(base, dir, 'chrome-win64', 'chrome.exe'), chromeFlags: ['--headless=new', '--ignore-certificate-errors', ...(v2 ? ['--host-resolver-rules=MAP ru.baptist.org.md 127.0.0.1:3443,MAP ro.baptist.org.md 127.0.0.1:3443'] : [])] });
const { lhr } = await lighthouse(url, { port: chrome.port, logLevel: 'error', onlyCategories: ['performance'], ...(process.env.LH_BLOCK ? { blockedUrlPatterns: process.env.LH_BLOCK.split(',') } : {}) });
await chrome.kill();
const m = lhr.audits.metrics.details.items[0];
console.log('score', lhr.categories.performance.score, 'sim LCP', Math.round(m.largestContentfulPaint), 'observed LCP', m.observedLargestContentfulPaint, 'FCP', Math.round(m.firstContentfulPaint), 'observed FCP', m.observedFirstContentfulPaint, 'TBT', Math.round(m.totalBlockingTime));
const bd = lhr.audits['lcp-breakdown-insight']?.details?.items;
console.log('LCP node:', JSON.stringify(bd?.[1]?.selector ?? bd?.[1] ?? null)?.slice(0, 200));
const rows = lhr.audits['network-requests'].details.items
  .filter((r) => r.transferSize > 3000)
  .map((r) => `${Math.round(r.transferSize / 1024)}KB prio=${r.priority} start=${Math.round(r.networkRequestTime)} ${r.url.replace(/https:\/\/[^/]+/, '').slice(0, 95)}`);
console.log(rows.join('\n'));
console.log(JSON.stringify(lhr.audits['lcp-breakdown-insight']?.details?.items?.[0]?.items?.map((i) => `${i.subpart}:${Math.round(i.duration)}`)));
console.log(JSON.stringify(lhr.audits['lcp-discovery-insight']?.details?.items?.[0]?.items));
const bt = lhr.audits['bootup-time']?.details?.items ?? [];
console.log('bootup:', bt.slice(0, 8).map((i) => `${Math.round(i.total)}ms(script ${Math.round(i.scripting)}) ${i.url.replace(/https:\/\/[^/]+/, '').slice(0, 60)}`).join('\n  '));
const th = lhr.audits['mainthread-work-breakdown']?.details?.items ?? [];
console.log('main thread:', th.slice(0, 6).map((i) => `${i.groupLabel} ${Math.round(i.duration)}`).join(', '));
const un = lhr.audits['unused-javascript']?.details?.items ?? [];
console.log('unused js:', un.slice(0, 6).map((i) => `${Math.round(i.wastedBytes / 1024)}/${Math.round(i.totalBytes / 1024)}KB ${i.url.replace(/https:\/\/[^/]+/, '').slice(0, 50)}`).join('\n  '));
