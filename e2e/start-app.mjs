// Builds and serves the app for e2e with WP redirected to the local mock (e2e/mock-wp).
// Used by playwright.config.ts (`webServer`); the mock server must already be running.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const preload = path.join(root, 'e2e', 'mock-wp', 'preload.cjs');
const port = process.env.E2E_PORT ?? '3100';

const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(preload)}`.trim(),
  MOCK_WP_URL: process.env.MOCK_WP_URL ?? 'http://127.0.0.1:4010',
  VIEWS_SECRET_RU: 'e2e-secret-ru',
  VIEWS_SECRET_RO: 'e2e-secret-ro',
  NEXT_TELEMETRY_DISABLED: '1',
};
delete env.SITE_OVERRIDE;

const next = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [next, ...args], { cwd: root, env, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited ${code}`))));
    if (args[0] === 'start') {
      for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
    }
  });
}

if (!process.env.E2E_SKIP_BUILD) await run(['build']);
await run(['start', '-p', port]);
