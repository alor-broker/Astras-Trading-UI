import {app, BrowserWindow, ipcMain, Menu, net, powerMonitor, session, WebContentsView} from 'electron';
import type {IpcMainEvent, IpcMainInvokeEvent} from 'electron';
import {randomUUID} from 'node:crypto';
import {dirname, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {authenticate, AuthError} from './auth';
import {Failure, Status, type Identity, type ManagerConfig, type ShellState} from './contracts';
import {decryptVault, readBoundedFile} from './vault';
import {dictionary} from './translations';
import {enableDevToolsShortcut} from './devtools';
import type {AuthDiagnostic} from './auth-diagnostics';

const BAR_HEIGHT = 112;
const indexPath = join(__dirname, '../public/index.html');
const shellUrl = pathToFileURL(indexPath).href;
let window: BrowserWindow | null = null;
let config: ManagerConfig | null = null;
let view: WebContentsView | null = null;
let pendingSeed: Identity | null = null;
let seeded = false;
let operation = 0;
let abort: AbortController | null = null;
let cleanup: Promise<void> = Promise.resolve();
let state: ShellState = {status: Status.Locked, error: Failure.None, clients: [], activeClientId: null};

function publish(): void {
  if (window && !window.isDestroyed()) window.webContents.send('manager:changed', state);
}

function reportAuth(diagnostic: AuthDiagnostic): void {
  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
    window.webContents.send('manager:auth-diagnostic', diagnostic);
  }
}

function isShell(event: IpcMainInvokeEvent): boolean {
  return window !== null && !window.isDestroyed() && event.sender === window.webContents
    && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url === shellUrl;
}

function isTerminal(event: IpcMainEvent): boolean {
  if (!view || view.webContents.isDestroyed() || !config || event.sender !== view.webContents
    || event.senderFrame !== view.webContents.mainFrame) return false;
  try {
    return new URL(event.senderFrame.url).origin === new URL(config.terminalUrl).origin;
  } catch {
    return false;
  }
}

function resize(): void {
  if (!window || window.isDestroyed() || !view) return;
  const [width = 0, height = 0] = window.getContentSize();
  view.setBounds({x: 0, y: BAR_HEIGHT, width, height: Math.max(0, height - BAR_HEIGHT)});
}

function closeTerminal(): Promise<void> {
  const previous = view;
  view = null;
  pendingSeed = null;
  seeded = false;
  if (previous && !previous.webContents.isDestroyed()) {
    const contents = previous.webContents;
    const browserSession = contents.session;
    // Stop subsequent requests before destroying the renderer. Do not run page
    // beforeunload handlers: those could prevent a switch or issue new requests.
    browserSession.webRequest.onBeforeRequest((_details, callback) => callback({cancel: true}));
    if (window && !window.isDestroyed()) window.contentView.removeChildView(previous);
    contents.close({waitForBeforeUnload: false});
    cleanup = cleanup.then(async () => {
      await browserSession.closeAllConnections();
      await browserSession.clearStorageData();
      await browserSession.clearCache();
    });
  }
  return cleanup;
}

async function lock(): Promise<void> {
  operation++;
  abort?.abort();
  abort = null;
  config = null;
  state = {status: Status.Locked, error: Failure.None, clients: [], activeClientId: null};
  // Destruction is synchronous; cleanup completes before another view can open.
  const closing = closeTerminal();
  publish();
  try {
    await closing;
  } catch {
    // A failed session wipe must never allow further sessions in this process.
    app.quit();
  }
}

async function endSession(failure: Failure): Promise<void> {
  operation++;
  abort?.abort();
  abort = null;
  state = {...state, status: config ? Status.Choose : Status.Locked, activeClientId: null, error: failure};
  const closing = closeTerminal();
  publish();
  try { await closing; } catch { app.quit(); }
}

function configPath(): string {
  const folder = app.isPackaged
    ? process.env.PORTABLE_EXECUTABLE_DIR ?? dirname(app.getPath('exe'))
    : join(app.getAppPath(), 'private');
  return join(folder, 'clients.enc');
}

async function unlock(password: unknown): Promise<void> {
  if (state.status !== Status.Locked || typeof password !== 'string' || password.length > 1024) return;
  const current = ++operation;
  state = {...state, status: Status.Unlocking, error: Failure.None};
  publish();
  let encoded: string;
  try {
    encoded = await readBoundedFile(configPath());
  } catch {
    if (operation === current) {
      state = {...state, status: Status.Locked, error: Failure.ConfigMissing};
      publish();
    }
    return;
  }
  try {
    const unlocked = await decryptVault(encoded, password);
    if (operation !== current) return;
    config = unlocked;
    state = {
      status: Status.Choose, error: Failure.None, activeClientId: null,
      clients: unlocked.clients.map(({clientId, displayName}) => ({clientId, displayName}))
    };
  } catch {
    if (operation !== current) return;
    state = {...state, status: Status.Locked, error: Failure.Unlock};
  } finally {
    password = '';
  }
  publish();
}

async function selectClient(clientId: unknown): Promise<void> {
  if (!config || typeof clientId !== 'string' || state.status === Status.Switching) return;
  const client = config.clients.find(entry => entry.clientId === clientId);
  if (!client) return;
  const selectedConfig = config;
  const current = ++operation;
  abort?.abort();
  const controller = new AbortController();
  abort = controller;
  state = {...state, status: Status.Switching, error: Failure.None, activeClientId: null};
  const closing = closeTerminal();
  publish();
  try {
    await closing;
    if (operation !== current) return;
    const identity = await authenticate(selectedConfig.clientDataUrl, client, controller.signal,
      (url, init) => net.fetch(url, init), reportAuth);
    if (operation !== current || !window || window.isDestroyed()) return;
    const browserSession = session.fromPartition(`manager-${randomUUID()}`, {cache: false});
    browserSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    browserSession.setPermissionCheckHandler(() => false);
    browserSession.on('will-download', event => event.preventDefault());
    const terminal = new WebContentsView({webPreferences: {
      session: browserSession,
      preload: join(__dirname, 'preload-terminal.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
      webSecurity: true,
      safeDialogs: true,
      navigateOnDragDrop: false
    }});
    view = terminal;
    pendingSeed = identity;
    seeded = false;
    terminal.setVisible(false);
    window.contentView.addChildView(terminal);
    resize();
    const contents = terminal.webContents;
    enableDevToolsShortcut(contents);
    const origin = new URL(selectedConfig.terminalUrl).origin;
    const allowed = (url: string): boolean => {
      try {
        const target = new URL(url);
        return target.origin === origin && !/^\/auth(?:\/|$)/u.test(target.pathname);
      } catch { return false; }
    };
    contents.setWindowOpenHandler(() => ({action: 'deny'}));
    contents.on('will-navigate', (event, url) => {
      if (!allowed(url)) {
        event.preventDefault();
        if (view === terminal) void endSession(Failure.Session);
      }
    });
    contents.on('will-redirect', (event, url, _inPlace, mainFrame) => {
      if (mainFrame && !allowed(url)) {
        event.preventDefault();
        if (view === terminal) void endSession(Failure.Session);
      }
    });
    contents.on('did-navigate-in-page', (_event, url, mainFrame) => {
      if (mainFrame && !allowed(url) && view === terminal) void endSession(Failure.Session);
    });
    contents.on('render-process-gone', () => {
      if (view === terminal) void endSession(Failure.Session);
    });
    contents.on('did-fail-load', (_event, code, _description, _url, mainFrame) => {
      if (mainFrame && code !== -3 && view === terminal) void endSession(Failure.Load);
    });
    // Timeout also covers a server that never finishes the main document.
    const timeout = setTimeout(() => {
      if (operation === current && view === terminal) void endSession(Failure.Load);
    }, 30000);
    try {
      await contents.loadURL(selectedConfig.terminalUrl);
    } finally {
      clearTimeout(timeout);
    }
    if (operation !== current || view !== terminal) return;
    if (!seeded) throw new Error('Credential bootstrap failed');
    state = {...state, status: Status.Ready, activeClientId: client.clientId};
    publish();
    terminal.setVisible(true);
  } catch (error: unknown) {
    if (operation !== current) return;
    await endSession(error instanceof AuthError ? error.failure : Failure.Load);
  }
}

function registerIpc(): void {
  ipcMain.handle('manager:state', event => {
    if (!isShell(event)) throw new Error('Forbidden');
    return state;
  });
  ipcMain.handle('manager:unlock', async (event, password: unknown) => {
    if (!isShell(event)) throw new Error('Forbidden');
    await unlock(password);
  });
  ipcMain.handle('manager:select', async (event, clientId: unknown) => {
    if (!isShell(event)) throw new Error('Forbidden');
    await selectClient(clientId);
  });
  ipcMain.handle('manager:lock', async event => {
    if (!isShell(event)) throw new Error('Forbidden');
    await lock();
  });
  ipcMain.on('manager:seed', event => {
    event.returnValue = isTerminal(event) && pendingSeed ? JSON.stringify(pendingSeed) : null;
    if (isTerminal(event)) pendingSeed = null;
  });
  ipcMain.on('manager:seeded', event => {
    if (isTerminal(event)) seeded = true;
  });
  ipcMain.on('manager:seed-failed', event => {
    if (isTerminal(event)) void endSession(Failure.Load);
  });
}

app.setName('Astras Manager');
app.commandLine.appendSwitch('disable-http-cache');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  void app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    registerIpc();
    const localSession = session.fromPartition('manager-shell', {cache: false});
    localSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    localSession.setPermissionCheckHandler(() => false);
    window = new BrowserWindow({
      width: 1400, height: 900, minWidth: 1100, minHeight: 600,
      title: dictionary(app.getLocale()).title,
      webPreferences: {
        session: localSession, preload: join(__dirname, 'preload-shell.js'),
        nodeIntegration: false, contextIsolation: true, sandbox: true, devTools: true
      }
    });
    enableDevToolsShortcut(window.webContents);
    window.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.on('resize', resize);
    window.on('closed', () => { window = null; void lock(); });
    powerMonitor.on('lock-screen', () => { void lock(); });
    powerMonitor.on('suspend', () => { void lock(); });
    await window.loadFile(indexPath);
  }).catch(() => app.quit());
}
app.on('before-quit', () => {
  operation++;
  abort?.abort();
  config = null;
  void closeTerminal().catch(() => undefined);
});
app.on('window-all-closed', () => app.quit());
