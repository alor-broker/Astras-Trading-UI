import {describe, expect, it} from 'vitest';
import {ManagerConfigFixtures} from '@testing-lib/fixtures/manager-config';
import {parseConfig} from './config';

describe('parseConfig', () => {
  it('should preserve client IDs and normalize the API base URL', () => {
    const config = ManagerConfigFixtures.createConfig();
    config.clientDataUrl += '/';

    const parsed = parseConfig(config);

    expect(parsed.clientDataUrl).toBe('https://identity.example.com');
    expect(parsed.clients.map(client => client.clientId)).toEqual(['client-a', 'client-b']);
  });

  it.each([null, undefined, {}, {schemaVersion: 2}, {schemaVersion: 1, clients: []}])(
    'should reject an invalid configuration', value => {
      expect(() => parseConfig(value)).toThrow();
    }
  );

  it.each(['http://terminal.example.com', 'https://user:password@terminal.example.com', 'file:///terminal.html', 'https://terminal.example.com/?token=secret'])(
    'should reject unsafe terminal URLs', terminalUrl => {
      const config = {...ManagerConfigFixtures.createConfig(), terminalUrl};

      expect(() => parseConfig(config)).toThrow();
    }
  );

  it('should reject duplicate client IDs to prevent ambiguous selection', () => {
    const config = ManagerConfigFixtures.createConfig();
    config.clients[1]!.clientId = config.clients[0]!.clientId;

    expect(() => parseConfig(config)).toThrow();
  });

  it('should reject blank refresh tokens', () => {
    const config = ManagerConfigFixtures.createConfig();
    config.clients[0]!.refreshToken = ' ';

    expect(() => parseConfig(config)).toThrow();
  });
});
