import { spawnSync } from 'node:child_process';
const r = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, E2E_SUITE: 'smoke' },
});
process.exit(r.status ?? 1);
