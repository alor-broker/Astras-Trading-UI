import type {ManagerConfig} from './contracts';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 1024;

export enum EncryptionStatus {
  Saved = 'saved',
  Cancelled = 'cancelled',
  Failed = 'failed'
}

export enum EncryptionError {
  Password = 'encryptorPasswordError',
  Configuration = 'encryptorConfigError',
  Save = 'encryptorSaveError',
  Busy = 'encryptorBusy'
}

export interface EncryptionRequest {
  config: ManagerConfig;
  password: string;
  confirmation: string;
  locale: string;
}

export interface EncryptionResult {
  status: EncryptionStatus;
  error?: EncryptionError;
  filePath?: string;
}

export interface EncryptorBridge {
  save(request: EncryptionRequest): Promise<EncryptionResult>;
}
