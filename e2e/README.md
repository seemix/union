# e2e (Playwright)

```
npm run test:e2e                      # ru + ro, build + next start + mock WP (production WP is never contacted)
E2E_SKIP_BUILD=1 npm run test:e2e     # reuse the existing .next build (it must have been built WITH the mock: use the command above once)
npx playwright test --project=ro      # one site
npm run test:smoke                    # read-only checks of staging (E2E_SMOKE_RU / E2E_SMOKE_RO, default https://next.ru|ro.baptist.org.md)
```

- `mock-wp/` — fake WordPress (REST, WPGraphQL menu, views endpoint, images) on :4010 with fixtures for both sites.
  `mock-wp/preload.cjs` is loaded via `NODE_OPTIONS=--require` into `next build`/`next start` and redirects every
  request to `baptist.org.md` to the mock. Fixture ids (e.g. 9001) do not exist in prod, so a leak would fail the tests.
- Sites are picked by host: `ru.localhost:3100`, `ro.localhost:3100`.
- Playwright's default UA contains "HeadlessChrome", which the views endpoint treats as a bot; `playwright.config.ts` overrides it.
- The smoke suite never opens posts in a browser (the view beacon would increment production counters).
- Do not run `E2E_SKIP_BUILD` after a plain `next build`: that build talks to real WP and the fixtures will not match.
