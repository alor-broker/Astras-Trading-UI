const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { contentChild } = require('@angular/core');

const LANG_CODE = 'hy';
const LANG = 'Armenian';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = '';
const MODEL = 'google/gemini-2.0-flash-001';
const SKIP_EXISTING = true;

async function findAllRuFiles(dir) {
  const pattern = path.join(dir, '**', 'ru.json').replace(/\\/g, '/');
  return await glob(pattern);
}

async function translateObject(obj) {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: `You are a helpful assistant that translates JSON file values from Russian to ${LANG}. Return ONLY the translated JSON object, without any extra text or explanations.` },
      { role: 'user', content: `Translate the values in this JSON object to ${LANG}:\n${JSON.stringify(obj, null, 2)}` }
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

async function processFile(filePath) {
  try {
    const dir = path.dirname(filePath);
    const newFilePath = path.join(dir, `${LANG_CODE}.json`);

    if(SKIP_EXISTING) {

      if(fs.existsSync(newFilePath)) {
        console.log(`Skip existing file ${newFilePath}`);
        return null;
      }
    }

    const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
    const jsonObj = JSON.parse(removeUTF8BOM(content));

    console.log(`Translating ${filePath}...`);
    const translatedObj = await translateObject(jsonObj);


    await fs.promises.writeFile(newFilePath, JSON.stringify(translatedObj, null, 2), 'utf8');
    console.log(`Successfully created ${newFilePath}`);
    return null;
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error.message);
    return filePath;
  }
}

async function main() {
  if (!API_KEY) {
    console.error('Error: OPENROUTER_API_KEY variable is not set.');
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
    const result = await processFile(file);
    if (result) {
      failedFiles.push(result);
    }
  }

  if (failedFiles.length > 0) {
    console.log('\n--- Processing Summary ---');
    console.error('Failed to process the following files:');
    failedFiles.forEach(file => console.error(`- ${file}`));
  } else {
    console.log('\nAll files processed successfully!');
  }
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
});
