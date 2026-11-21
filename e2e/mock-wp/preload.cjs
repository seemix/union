// Loaded with `node --require` into the Next process (build and `next start`):
// every request to the production WP host goes to the local mock instead.
// Only that host is touched, so a test run can never reach production WP.
const MOCK = process.env.MOCK_WP_URL || 'http://127.0.0.1:4010';
const realFetch = globalThis.fetch;

globalThis.fetch = function mockedFetch(input, init) {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return realFetch(input, init);
  }
  if (url.hostname !== 'baptist.org.md') return realFetch(input, init);
  const target = MOCK + url.pathname + url.search;
  if (typeof input === 'object' && !(input instanceof URL)) return realFetch(new Request(target, input), init);
  return realFetch(target, init);
};
