import { defineConfig } from '@playwright/test';

/**
 * Two suites:
 *  - `ru` / `ro` (default): full e2e against a local `next start` whose WP requests are served by
 *    e2e/mock-wp (fixtures). Production WP is never contacted. Sites are selected by host:
 *    `ru.localhost` / `ro.localhost`.
 *  - `smoke-ru` / `smoke-ro` (`npm run test:smoke`): read-only checks of staging
 *    (E2E_SMOKE_RU / E2E_SMOKE_RO, default https://next.ru|ro.baptist.org.md).
 */
const PORT = process.env.E2E_PORT ?? '3100';
const MOCK_PORT = process.env.MOCK_WP_PORT ?? '4010';
const smoke = process.env.E2E_SUITE === 'smoke';

// Playwright's default UA contains "HeadlessChrome", which the views endpoint (rightly) treats as a bot.
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: smoke ? /smoke\.spec\.ts/ : /^(?!.*smoke).*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
  outputDir: 'e2e/results',
  use: { userAgent, trace: 'retain-on-failure' },
  projects: smoke
    ? [
        { name: 'smoke-ru', use: { baseURL: process.env.E2E_SMOKE_RU ?? 'https://next.ru.baptist.org.md' }, metadata: { site: 'ru' } },
        { name: 'smoke-ro', use: { baseURL: process.env.E2E_SMOKE_RO ?? 'https://next.ro.baptist.org.md' }, metadata: { site: 'ro' } },
      ]
    : [
        { name: 'ru', use: { baseURL: `http://ru.localhost:${PORT}` }, metadata: { site: 'ru' } },
        { name: 'ro', use: { baseURL: `http://ro.localhost:${PORT}` }, metadata: { site: 'ro' } },
      ],
  webServer: smoke
    ? undefined
    : [
        {
          command: 'node e2e/mock-wp/server.mjs',
          url: `http://127.0.0.1:${MOCK_PORT}/__mock/health`,
          env: { VIEWS_SECRET_RU: 'e2e-secret-ru', VIEWS_SECRET_RO: 'e2e-secret-ro' },
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'node e2e/start-app.mjs',
          port: Number(PORT),
          timeout: 600_000,
          reuseExistingServer: !process.env.CI,
          stdout: 'pipe',
        },
      ],
});
