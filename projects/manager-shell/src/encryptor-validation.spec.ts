import {describe, expect, it} from 'vitest';
import {ManagerConfigFixtures} from '@testing-lib/fixtures/manager-config';
import {EncryptionError} from './encryptor-contracts';
import {validateEncryptionRequest} from './encryptor-validation';

describe('validateEncryptionRequest', () => {
  const request = () => ({
    config: ManagerConfigFixtures.createConfig(),
    password: 'synthetic test password',
    confirmation: 'synthetic test password',
    locale: 'en'
  });

  it('should preserve the configuration and password for compatible vault encryption', () => {
    const input = request();

    expect(validateEncryptionRequest(input)).toEqual(input);
  });

  it.each(['', 'short', 'x'.repeat(1025)])('should reject an invalid password length', password => {
    expect(() => validateEncryptionRequest({...request(), password, confirmation: password}))
      .toThrow(EncryptionError.Password);
  });

  it('should reject mismatched password confirmation', () => {
    expect(() => validateEncryptionRequest({...request(), confirmation: 'another password'}))
      .toThrow(EncryptionError.Password);
  });

  it('should reject duplicate client IDs before offering to save', () => {
    const input = request();
    input.config.clients[1]!.clientId = input.config.clients[0]!.clientId;

    expect(() => validateEncryptionRequest(input)).toThrow(EncryptionError.Configuration);
  });

  it('should reject an insecure terminal address', () => {
    const input = request();
    input.config.terminalUrl = 'http://terminal.example.com';

    expect(() => validateEncryptionRequest(input)).toThrow(EncryptionError.Configuration);
  });

  it.each([null, undefined, '', {}])('should reject malformed IPC input', value => {
    expect(() => validateEncryptionRequest(value)).toThrow(EncryptionError.Password);
  });
});
