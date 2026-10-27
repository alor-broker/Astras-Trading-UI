import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {alias: {'@testing-lib': fileURLToPath(new URL('../testing-lib/src', import.meta.url))}},
  test: {include: ['src/**/*.smoke.spec.ts'], testTimeout: 60000}
});
