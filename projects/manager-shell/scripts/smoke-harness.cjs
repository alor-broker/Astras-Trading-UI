// Runs only under the test runner, never packaged. All HTTPS requests are served
// in memory by Electron protocol handlers; no production API or local server.
const {app, session, webContents} = require('electron');
const {join} = require('node:path');
const {writeFile} = require('node:fs/promises');
const {setTimeout: delay} = require('node:timers/promises');

const temp = process.argv[2];
app.setAppPath(temp);
app.setPath('userData', join(temp, 'profile'));
let shell;
let mode = 'normal';
let requests = [];
let delayed;
const t0 = 1800000000000;
const report = {};
const prepared = new WeakSet();
const authLogs = [];

async function handler(request) {
  const url = new URL(request.url);
  if (url.origin === 'https://identity.example.com') {
    const {refreshToken} = await request.json();
    requests.push(refreshToken);
    if (mode === 'delay') await new Promise(resolve => { delayed = resolve; });
    const clientid = mode === 'wrong-identity' ? 'someone-else' : refreshToken.endsWith('-a') ? 'client-a' : 'client-b';
    const jwt = `header.${Buffer.from(JSON.stringify({clientid, exp: t0 / 1000 + 1000000000})).toString('base64url')}.signature`;
    return new Response(JSON.stringify({jwt}), {headers: {'Content-Type': 'application/json'}});
  }
  if (url.origin === 'https://terminal.example.com') {
    return new Response(`<!doctype html><html><body><p id="client"></p><script>
      window.identityAtStartup = JSON.parse(localStorage.getItem('sso'));
      document.getElementById('client').textContent = window.identityAtStartup.refreshToken;
    </script></body></html>`, {headers: {'Content-Type': 'text/html'}});
  }
  throw new Error('Unexpected test network request');
}

function prepare(browserSession) {
  if (prepared.has(browserSession)) return;
  prepared.add(browserSession);
  browserSession.protocol.handle('https', handler);
  browserSession.protocol.handle('http', () => new Response('', {status: 403}));
}
app.on('session-created', prepare);
app.on('browser-window-created', (_event, window) => {
  if (!shell) {
    shell = window;
    shell.webContents.on('console-message', details => {
      if (details.message.startsWith('[Astras Manager auth]')) authLogs.push(details.message);
    });
  }
  window.hide();
});

const invoke = code => shell.webContents.executeJavaScript(code);
const state = () => invoke('window.manager.getState()');
const remote = () => webContents.getAllWebContents().find(contents => contents !== shell.webContents && contents.getURL().startsWith('https://terminal.example.com'));
async function until(predicate) {
  for (let i = 0; i < 300; i++) {
    if (await predicate()) return;
    await delay(25);
  }
  throw new Error('Timed out waiting for test state');
}

async function checkF12(contents) {
  const press = () => {
    contents.emit('before-input-event', {preventDefault() {}}, {type: 'keyDown', key: 'F12', isAutoRepeat: false});
  };
  press();
  await until(() => contents.isDevToolsOpened());
  press();
  await until(() => !contents.isDevToolsOpened());
  return true;
}

async function run() {
  prepare(session.defaultSession);
  require('../dist/main.js');
  await until(() => shell && shell.webContents.getURL().startsWith('file:'));
  await until(() => invoke('typeof window.manager !== "undefined"').catch(() => false));
  report.initial = await state();
  report.shellF12 = await checkF12(shell.webContents);
  report.passwordControl = await invoke('({type: document.getElementById("password").type, label: document.getElementById("password").labels[0].textContent})');
  await invoke('window.manager.unlock("wrong password")');
  report.wrongPassword = await state();
  await invoke('window.manager.unlock("synthetic test password")');
  report.unlocked = await state();
  await invoke('window.manager.selectClient("client-a")');
  report.first = await state();
  const first = remote();
  if (first) {
    report.terminalF12 = await checkF12(first);
    report.firstBootstrap = await first.executeJavaScript('({identity: window.identityAtStartup, bridge: typeof window.manager, node: typeof require})');
    await first.executeJavaScript('localStorage.setItem("sentinel", "client-a-only")');
    const firstSession = first.session;
    await invoke('window.manager.selectClient("client-b")');
    report.firstDestroyed = first.isDestroyed();
    report.second = await state();
    report.selectedLabel = await invoke('document.getElementById("status").textContent');
    const second = remote();
    report.separateSession = second && second.session !== firstSession;
    report.secondBootstrap = second && await second.executeJavaScript('({identity: window.identityAtStartup, sentinel: localStorage.getItem("sentinel")})');
    report.persistent = second && second.session.isPersistent();
    await invoke('window.manager.selectClient("client-a")');
    report.returned = await state();
    mode = 'wrong-identity';
    await invoke('window.manager.selectClient("client-b")');
    report.mismatch = await state();
    report.mismatchHasView = !!remote();
    mode = 'normal';
    await invoke('window.manager.selectClient("client-a")');
    await remote().executeJavaScript('location.assign("https://login.example.com/")').catch(() => undefined);
    await until(async () => (await state()).status === 'choose');
    report.redirect = await state();
    mode = 'delay';
    const switching = invoke('window.manager.selectClient("client-b")');
    await until(() => typeof delayed === 'function');
    await invoke('window.manager.lock()');
    delayed();
    await switching;
    report.locked = await state();
    report.lockedHasView = !!remote();
  }
  report.requests = requests;
  report.authLogs = authLogs;
  await writeFile(join(temp, 'report.json'), JSON.stringify(report));
  app.exit(0);
}

void app.whenReady().then(run).catch(async error => {
  // Synthetic data only; never reuse this harness with real credentials.
  await writeFile(join(temp, 'report.json'), JSON.stringify({...report, harnessError: String(error)}));
  app.exit(1);
});
setTimeout(() => app.exit(2), 45000).unref();
