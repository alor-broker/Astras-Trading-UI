import {contextBridge, ipcRenderer} from 'electron';
import type {EncryptionRequest, EncryptionResult, EncryptorBridge} from './encryptor-contracts';

const bridge: EncryptorBridge = {
  save: (request: EncryptionRequest) => ipcRenderer.invoke('encryptor:save', request) as Promise<EncryptionResult>
};
contextBridge.exposeInMainWorld('encryptor', bridge);
