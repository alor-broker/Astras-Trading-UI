import {contextBridge, ipcRenderer} from 'electron';
import type {ShellBridge, ShellState} from './contracts';
import type {AuthDiagnostic} from './auth-diagnostics';

ipcRenderer.on('manager:auth-diagnostic', (_event, diagnostic: AuthDiagnostic) => {
  // A string snapshot remains readable when DevTools is opened after a failure.
  console.info('[Astras Manager auth]', JSON.stringify(diagnostic));
});

const bridge: ShellBridge = {
  getState: () => ipcRenderer.invoke('manager:state') as Promise<ShellState>,
  unlock: (password: string) => ipcRenderer.invoke('manager:unlock', password) as Promise<void>,
  selectClient: (clientId: string) => ipcRenderer.invoke('manager:select', clientId) as Promise<void>,
  lock: () => ipcRenderer.invoke('manager:lock') as Promise<void>,
  onState: (listener: (state: ShellState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: ShellState): void => listener(state);
    ipcRenderer.on('manager:changed', handler);
    return () => ipcRenderer.removeListener('manager:changed', handler);
  }
};

contextBridge.exposeInMainWorld('manager', bridge);
