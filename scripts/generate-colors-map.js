const fs = require('fs');
const path = require('path');
const lessToJs = require('less-vars-to-js');

const generate = (lessFilePath, jsonFilePath) => {
  const fileContent = fs.readFileSync(lessFilePath, 'utf8');
  const variablesStr = JSON.stringify(lessToJs(fileContent, {resolveVariables: true, stripPrefix: true}), null, 1)
  fs.writeFileSync(jsonFilePath, variablesStr, 'utf8');
};

generate(
  path.resolve('./src/styles/themes/default-shared-colors.less'),
  path.resolve('./src/assets/default-shared-colors-config.json')
);

generate(
  path.resolve('./src/styles/themes/dark-shared-colors.less'),
  path.resolve('./src/assets/dark-shared-colors-config.json')
);





