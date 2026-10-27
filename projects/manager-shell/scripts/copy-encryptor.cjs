const {copyFileSync} = require('node:fs');
const {join} = require('node:path');

const release = join(__dirname, '../release');
copyFileSync(join(release, 'encryptor/AstrasEncryptor.exe'), join(release, 'AstrasEncryptor.exe'));
