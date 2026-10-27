import type {ManagerConfig} from './contracts';

export const MAX_FILE_BYTES = 1024 * 1024;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0
    && value.length <= maxLength && !/[\u0000-\u001f\u007f]/u.test(value);
}

function httpsUrl(value: unknown): string {
  if (!validText(value, 2048)) throw new Error('Invalid configuration');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== ''
    || url.search !== '' || url.hash !== '') {
    throw new Error('Invalid configuration');
  }
  return url.href;
}

export function parseConfig(value: unknown): ManagerConfig {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.clients)
    || value.clients.length === 0 || value.clients.length > 1000) {
    throw new Error('Invalid configuration');
  }
  const terminalUrl = httpsUrl(value.terminalUrl);
  const clientDataUrl = httpsUrl(value.clientDataUrl).replace(/\/$/u, '');
  const ids = new Set<string>();
  const clients = value.clients.map((entry: unknown) => {
    if (!isRecord(entry) || !validText(entry.clientId, 200)
      || !validText(entry.displayName, 200) || !validText(entry.refreshToken, 16384)
      || ids.has(entry.clientId)) {
      throw new Error('Invalid configuration');
    }
    ids.add(entry.clientId);
    return {clientId: entry.clientId, displayName: entry.displayName, refreshToken: entry.refreshToken};
  });
  return {schemaVersion: 1, terminalUrl, clientDataUrl, clients};
}
