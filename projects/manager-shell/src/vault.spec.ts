import {afterEach, describe, expect, it, vi} from 'vitest';
import {ManagerConfigFixtures} from '@testing-lib/fixtures/manager-config';
import {decryptVault, encryptVault} from './vault';

vi.mock('node:crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {...actual, randomBytes: (size: number) => Buffer.alloc(size, 7)};
});

describe('Encrypted vault', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should round-trip the configuration without storing client data in plaintext', async () => {
    const config = ManagerConfigFixtures.createConfig();

    const encrypted = await encryptVault(config, 'a long test password');
    const decrypted = await decryptVault(encrypted, 'a long test password');

    expect(decrypted).toEqual(config);
    expect(encrypted).not.toContain('synthetic-token');
    expect(encrypted).not.toContain('Client A');
  });

  it('should reject the wrong password', async () => {
    const encrypted = await encryptVault(ManagerConfigFixtures.createConfig(), 'a long test password');

    await expect(decryptVault(encrypted, 'a different password')).rejects.toThrow();
  });

  it('should reject modified ciphertext', async () => {
    const encrypted = await encryptVault(ManagerConfigFixtures.createConfig(), 'a long test password');
    const envelope = JSON.parse(encrypted) as {ciphertext: string};
    const bytes = Buffer.from(envelope.ciphertext, 'base64');
    bytes[0] = bytes[0]! ^ 1;
    envelope.ciphertext = bytes.toString('base64');

    await expect(decryptVault(JSON.stringify(envelope), 'a long test password')).rejects.toThrow();
  });

  it('should reject unknown formats before deriving a key', async () => {
    await expect(decryptVault('{"format":"unknown"}', 'password')).rejects.toThrow();
  });
});
