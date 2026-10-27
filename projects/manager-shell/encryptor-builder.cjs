module.exports = {
  extends: null,
  appId: 'com.astras.encryptor',
  productName: 'Astras Encryptor',
  extraMetadata: {name: 'astras-encryptor', productName: 'Astras Encryptor', main: 'dist/encryptor-main.js'},
  directories: {output: 'release/encryptor'},
  files: [
    'dist/encryptor-main.js', 'dist/encryptor-preload.js', 'dist/encryptor-renderer.js',
    'public/encryptor.html', 'public/encryptor.css', 'package.json'
  ],
  asar: true,
  win: {target: 'portable', artifactName: 'AstrasEncryptor.exe'},
  portable: {requestExecutionLevel: 'user'}
};
