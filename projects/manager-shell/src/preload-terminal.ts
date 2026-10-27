import {ipcRenderer} from 'electron';

// Runs before any hosted scripts. No API is exposed to the remote page.
// The main process validates this exact view, top-level frame and origin.
if (process.isMainFrame) {
  const seed: unknown = ipcRenderer.sendSync('manager:seed');
  if (typeof seed === 'string') {
    try {
      localStorage.setItem('sso', seed);
      ipcRenderer.send('manager:seeded');
    } catch {
      ipcRenderer.send('manager:seed-failed');
    }
  }
}
