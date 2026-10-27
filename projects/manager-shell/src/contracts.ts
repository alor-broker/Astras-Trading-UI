export interface ClientEntry {
  clientId: string;
  displayName: string;
  refreshToken: string;
}

export interface ManagerConfig {
  schemaVersion: 1;
  terminalUrl: string;
  clientDataUrl: string;
  clients: ClientEntry[];
}

export interface Identity {
  refreshToken: string;
  jwt: string;
}

export enum Status {
  Locked = 'locked',
  Unlocking = 'unlocking',
  Choose = 'choose',
  Switching = 'switching',
  Ready = 'ready'
}

export enum Failure {
  None = '',
  Unlock = 'unlockError',
  ConfigMissing = 'configMissing',
  Authentication = 'authenticationError',
  Identity = 'identityError',
  Load = 'loadError',
  Session = 'sessionError'
}

export interface ShellState {
  status: Status;
  error: Failure;
  clients: Omit<ClientEntry, 'refreshToken'>[];
  activeClientId: string | null;
}

export interface ShellBridge {
  getState(): Promise<ShellState>;
  unlock(password: string): Promise<void>;
  selectClient(clientId: string): Promise<void>;
  lock(): Promise<void>;
  onState(listener: (state: ShellState) => void): () => void;
}
