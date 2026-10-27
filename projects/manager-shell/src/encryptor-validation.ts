import {isRecord, parseConfig} from './config';
import {EncryptionError, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type EncryptionRequest} from './encryptor-contracts';

export class EncryptionValidationError extends Error {
  constructor(readonly code: EncryptionError) {
    super(code);
  }
}

export function validateEncryptionRequest(value: unknown): EncryptionRequest {
  if (!isRecord(value) || typeof value.password !== 'string'
    || value.password.length < MIN_PASSWORD_LENGTH || value.password.length > MAX_PASSWORD_LENGTH
    || value.password !== value.confirmation) {
    throw new EncryptionValidationError(EncryptionError.Password);
  }
  try {
    return {
      config: parseConfig(value.config),
      password: value.password,
      confirmation: value.password,
      locale: typeof value.locale === 'string' ? value.locale.slice(0, 10) : 'en'
    };
  } catch {
    throw new EncryptionValidationError(EncryptionError.Configuration);
  }
}
