// Test-only harness. Hidden Electron window, synthetic entries, mocked Save dialog.
const {app, dialog} = require('electron');
const {join} = require('node:path');
const {readFile, writeFile} = require('node:fs/promises');
const {setTimeout: delay} = require('node:timers/promises');
const directory = process.argv[2];
app.setAppPath(directory);
app.setPath('userData', join(directory, 'profile'));
let window;
let mode = 'cancel';
let dialogCalls = 0;
let networkCalls = 0;
const report = {};

app.on('browser-window-created', (_event, created) => {
  window = created;
  created.hide();
  created.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (/^https?:/u.test(details.url)) networkCalls++;
    callback({requestHeaders: details.requestHeaders});
  });
});
dialog.showSaveDialog = async () => {
  dialogCalls++;
  if (mode === 'cancel') return {canceled: true, filePath: ''};
  return {canceled: false, filePath: mode === 'failure'
    ? join(directory, 'missing-folder/clients.enc') : join(directory, 'clients.enc')};
};

const invoke = code => window.webContents.executeJavaScript(code);
async function until(predicate) {
  for (let i = 0; i < 300; i++) {
    if (await predicate()) return;
    await delay(25);
  }
  throw new Error('Timed out waiting for encryptor');
}
async function submit() {
  await invoke('document.getElementById("encrypt-form").requestSubmit()');
  await until(() => invoke('!document.getElementById("fields").disabled'));
}

async function run() {
  const config = JSON.parse(await readFile(join(directory, 'input.json'), 'utf8'));
  const payload = {config, password: 'synthetic test password', confirmation: 'synthetic test password', locale: 'en'};
  require('../dist/encryptor-main.js');
  await until(() => window && window.webContents.getURL().startsWith('file:'));
  await until(() => invoke('typeof window.encryptor !== "undefined"').catch(() => false));
  await invoke(`
    document.getElementById('language').value = 'en';
    document.getElementById('language').dispatchEvent(new Event('change'));
    const config = ${JSON.stringify(config)};
    document.getElementById('terminal-url').value = config.terminalUrl;
    document.getElementById('api-url').value = config.clientDataUrl;
    document.getElementById('add-client').click();
    document.querySelectorAll('.client-row').forEach((row, index) => {
      row.querySelector('.client-name').value = config.clients[index].displayName;
      row.querySelector('.client-id').value = config.clients[index].clientId;
      row.querySelector('.client-token').value = config.clients[index].refreshToken;
    });
    document.getElementById('password').value = 'synthetic test password';
    document.getElementById('confirmation').value = 'mismatched password';
  `);
  report.masked = await invoke('Array.from(document.querySelectorAll(".client-token")).every(input => input.type === "password")');
  await submit();
  report.passwordMismatch = await invoke('document.getElementById("error").textContent');
  report.passwordMismatchDialogCalls = dialogCalls;
  const duplicate = structuredClone(payload);
  duplicate.config.clients[1].clientId = duplicate.config.clients[0].clientId;
  report.duplicate = await invoke(`window.encryptor.save(${JSON.stringify(duplicate)})`);
  await invoke('document.getElementById("confirmation").value = "synthetic test password"');
  await submit();
  report.cancelled = await invoke(`({
    tokenRetained: document.querySelector('.client-token').value === 'synthetic-token-a',
    passwordRetained: document.getElementById('password').value === 'synthetic test password'
  })`);
  mode = 'save';
  await invoke('document.getElementById("show-tokens").click()');
  await submit();
  report.saved = await invoke(`({
    rowCount: document.querySelectorAll('.client-row').length,
    emptyToken: document.querySelector('.client-token').value === '',
    emptyPassword: document.getElementById('password').value === '' && document.getElementById('confirmation').value === '',
    masked: document.querySelector('.client-token').type === 'password'
  })`);
  report.savedMessage = await invoke('document.getElementById("result").textContent');
  report.replaced = await invoke(`window.encryptor.save(${JSON.stringify(payload)})`);
  mode = 'failure';
  report.failedSave = await invoke(`window.encryptor.save(${JSON.stringify(payload)})`);
  report.storage = await invoke('({local: localStorage.length, session: sessionStorage.length})');
  report.networkCalls = networkCalls;
  window.setSize(760, 700);
  await invoke('document.getElementById("language").value = "hy"; document.getElementById("language").dispatchEvent(new Event("change"))');
  report.pageOverflow = await invoke('document.documentElement.scrollWidth > document.documentElement.clientWidth');
  await writeFile(join(directory, 'report.json'), JSON.stringify(report));
  app.exit(0);
}

void app.whenReady().then(run).catch(async error => {
  await writeFile(join(directory, 'report.json'), JSON.stringify({...report, harnessError: String(error)}));
  app.exit(1);
});
setTimeout(() => app.exit(2), 45000).unref();
