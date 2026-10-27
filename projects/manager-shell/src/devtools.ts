import type {WebContents} from 'electron';

export function enableDevToolsShortcut(contents: WebContents): void {
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.key !== 'F12' || input.isAutoRepeat) return;
    event.preventDefault();
    if (contents.isDevToolsOpened()) contents.closeDevTools();
    else contents.openDevTools({mode: 'detach'});
  });
}
