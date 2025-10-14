const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = '';
const MODEL = 'google/gemini-2.0-flash-001';
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hy', name: 'Armenian' }
];

async function findAllRuFiles(dir) {
  const pattern = path.join(dir, '**', 'ru.json').replace(/\\/g, '/');
  return await glob(pattern);
}

async function translateObject(obj, langName) {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: `You are a helpful assistant that translates JSON file values from Russian to ${langName}. All translations are targeted for trading terminal. Return ONLY the translated JSON object, without any extra text or explanations.` },
      { role: 'user', content: `Translate the values in this JSON object to ${langName}:\n${JSON.stringify(obj, null, 2)}` }
    ]
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: headers,
    body: body
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const translatedContent = data.choices[0].message.content;

  // Clean up the response to get only the JSON part
  const jsonMatch = translatedContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find a valid JSON object in the API response.');
  }

  return JSON.parse(jsonMatch[0]);
}

function removeUTF8BOM(str) {
    return str.replace(/^\uFEFF/, '');
}

async function processFile(filePath, langCode, langName) {
  try {
    const dir = path.dirname(filePath);
    const newFilePath = path.join(dir, `${langCode}.json`);

    const sourceContent = await fs.promises.readFile(filePath, { encoding: 'utf8' });
    const sourceObj = JSON.parse(removeUTF8BOM(sourceContent));

    if (fs.existsSync(newFilePath)) {
      const existingContent = await fs.promises.readFile(newFilePath, { encoding: 'utf8' });
      const existingObj = JSON.parse(removeUTF8BOM(existingContent));

      const missingKeys = findMissingKeys(sourceObj, existingObj);

      if (Object.keys(missingKeys).length === 0) {
        console.log(`No missing keys in ${newFilePath}. Skipping.`);
        return null;
      }

      console.log(`Found missing keys in ${newFilePath}. Translating...`);

      const translatedMissingKeys = await translateObject(missingKeys, langName);

      const mergedObj = mergeDeep(existingObj, translatedMissingKeys);

      await fs.promises.writeFile(newFilePath, JSON.stringify(mergedObj, null, 2), 'utf8');
      console.log(`Successfully updated ${newFilePath} with new translations.`);
    } else {
      console.log(`Translating ${filePath} to ${langName}...`);
      const translatedObj = await translateObject(sourceObj, langName);

      await fs.promises.writeFile(newFilePath, JSON.stringify(translatedObj, null, 2), 'utf8');
      console.log(`Successfully created ${newFilePath}`);
    }

    return null;
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error.message);
    return filePath;
  }
}

function findMissingKeys(source, target) {
  const missing = {};

  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof target[key] === 'object' && target[key] !== null) {
        const nestedMissing = findMissingKeys(source[key], target[key]);
        if (Object.keys(nestedMissing).length > 0) {
          missing[key] = nestedMissing;
        }
      } else {
        missing[key] = source[key];
      }
    } else if (!(key in target)) {
      missing[key] = source[key];
    }
  }

  return missing;
}

function mergeDeep(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

async function main() {
  if (!API_KEY) {
    console.error('Error: API_KEY variable is not set.');
    process.exit(1);
  }

  const i18nDir = path.resolve('../src/assets/i18n/');
  console.log(`Searching for ru.json files in ${i18nDir}...`);

  const ruFiles = await findAllRuFiles(i18nDir);

  if (ruFiles.length === 0) {
    console.log('No ru.json files found.');
    return;
  }

  console.log(`Found ${ruFiles.length} ru.json file(s):`);
  ruFiles.forEach(file => console.log(`- ${file}`));

  const failedFiles = [];
  for (const file of ruFiles) {
    for (const lang of LANGUAGES) {
      const result = await processFile(file, lang.code, lang.name);
      if (result) {
        failedFiles.push({ file, lang: lang.code });
      }
    }
  }

  if (failedFiles.length > 0) {
    console.log('\n--- Processing Summary ---');
    console.error('Failed to process the following files:');
    failedFiles.forEach(item => console.error(`- ${item.file} (lang: ${item.lang})`));
  } else {
    console.log('\nAll files processed successfully!');
  }
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
});
