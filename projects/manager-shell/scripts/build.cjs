const {buildSync} = require('esbuild');

buildSync({
  entryPoints: [
    'src/main.ts', 'src/encrypt.ts', 'src/preload-shell.ts', 'src/preload-terminal.ts',
    'src/encryptor-main.ts', 'src/encryptor-preload.ts'
  ],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
  target: 'node22'
});

buildSync({
  entryPoints: ['src/renderer.ts', 'src/encryptor-renderer.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'browser',
  target: 'es2022'
});
