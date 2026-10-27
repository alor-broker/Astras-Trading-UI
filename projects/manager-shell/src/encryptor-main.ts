import {app, BrowserWindow, dialog, ipcMain, Menu, session} from 'electron';
import type {IpcMainInvokeEvent} from 'electron';
import {extname, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {encryptVault} from './vault';
import {dictionary} from './translations';
import {EncryptionError, EncryptionStatus, type EncryptionResult} from './encryptor-contracts';
import {EncryptionValidationError, validateEncryptionRequest} from './encryptor-validation';
import {saveEncryptedFile} from './encryptor-save';

const pagePath = join(__dirname, '../public/encryptor.html');
const pageUrl = pathToFileURL(pagePath).href;
let window: BrowserWindow | null = null;
let busy = false;

function isTool(event: IpcMainInvokeEvent): boolean {
  return window !== null && !window.isDestroyed() && event.sender === window.webContents
    && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url === pageUrl;
}

async function save(request: unknown): Promise<EncryptionResult> {
  if (busy) return {status: EncryptionStatus.Failed, error: EncryptionError.Busy};
  busy = true;
  try {
    let validated = validateEncryptionRequest(request);
    request = null;
    const t = dictionary(validated.locale);
    const encrypted = await encryptVault(validated.config, validated.password);
    // No credentials are needed while the native Save dialog is open.
    validated = {...validated, password: '', confirmation: '', config: {...validated.config, clients: []}};
    if (!window || window.isDestroyed()) return {status: EncryptionStatus.Cancelled};
    const selection = await dialog.showSaveDialog(window, {
      title: t.encryptorSaveTitle,
      defaultPath: join(app.getPath('documents'), 'clients.enc'),
      buttonLabel: t.encryptorSave,
      filters: [{name: t.encryptorFileType, extensions: ['enc']}],
      properties: ['dontAddToRecent', 'showOverwriteConfirmation']
    });
    if (selection.canceled || !selection.filePath || !window || window.isDestroyed()) {
      return {status: EncryptionStatus.Cancelled};
    }
    if (extname(selection.filePath).toLowerCase() !== '.enc') {
      return {status: EncryptionStatus.Failed, error: EncryptionError.Save};
    }
    // Windows confirms an existing destination in the native Save dialog.
    await saveEncryptedFile(selection.filePath, encrypted);
    return {status: EncryptionStatus.Saved, filePath: selection.filePath};
  } catch (error: unknown) {
    return {
      status: EncryptionStatus.Failed,
      error: error instanceof EncryptionValidationError ? error.code : EncryptionError.Save
    };
  } finally {
    request = null;
    busy = false;
  }
}

app.setName('Astras Encryptor');
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
    const browserSession = session.fromPartition('astras-encryptor', {cache: false});
    browserSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    browserSession.setPermissionCheckHandler(() => false);
    browserSession.on('will-download', event => event.preventDefault());
    browserSession.webRequest.onBeforeRequest((details, callback) => {
      callback({cancel: !details.url.startsWith('file:')});
    });
    ipcMain.handle('encryptor:save', async (event, request: unknown) => {
      if (!isTool(event)) throw new Error('Forbidden');
      return save(request);
    });
    window = new BrowserWindow({
      width: 1100, height: 860, minWidth: 760, minHeight: 600,
      title: dictionary(app.getLocale()).encryptorTitle,
      webPreferences: {
        session: browserSession,
        preload: join(__dirname, 'encryptor-preload.js'),
        nodeIntegration: false, contextIsolation: true, sandbox: true, devTools: false
      }
    });
    window.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.on('closed', () => { window = null; });
    await window.loadFile(pagePath);
  }).catch(() => app.quit());
}
app.on('window-all-closed', () => app.quit());
