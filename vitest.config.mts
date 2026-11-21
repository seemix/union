import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Mirrors `paths` in tsconfig.json.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { exclude: ['**/node_modules/**', 'legacy/**', 'dist/**', 'back/**', 'e2e/**'] },
});
