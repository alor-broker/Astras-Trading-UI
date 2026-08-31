import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'zone.js/testing': resolve(
        workspaceRoot,
        'projects/testing-lib/src/angular/zone-testing-empty.ts'
      )
    }
  }
});
