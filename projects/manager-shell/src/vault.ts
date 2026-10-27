import {createCipheriv, createDecipheriv, randomBytes, scrypt} from 'node:crypto';
import {open} from 'node:fs/promises';
import {isRecord, MAX_FILE_BYTES, parseConfig} from './config';
import type {ManagerConfig} from './contracts';

const FORMAT = 'astras-manager-v1';
const AAD = Buffer.from(`${FORMAT}:scrypt-N131072-r8-p1:aes-256-gcm`);

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  if (password.length === 0 || password.length > 1024) throw new Error('Invalid password');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, {N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024}, (error, key) => {
      if (error) reject(new Error('Key derivation failed'));
      else resolve(key);
    });
  });
}

function decode(value: unknown, size?: number): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/u.test(value)) {
    throw new Error('Invalid vault');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || (size !== undefined && bytes.length !== size)) {
    throw new Error('Invalid vault');
  }
  return bytes;
}

export async function readBoundedFile(path: string): Promise<string> {
  const file = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await file.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > MAX_FILE_BYTES) throw new Error('File too large');
    return buffer.subarray(0, length).toString('utf8');
  } finally {
    await file.close();
  }
}

export async function encryptVault(config: ManagerConfig, password: string): Promise<string> {
  const plaintext = Buffer.from(JSON.stringify(parseConfig(config)));
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  try {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(AAD);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const encoded = JSON.stringify({
      format: FORMAT,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64')
    }, null, 2);
    if (Buffer.byteLength(encoded) > MAX_FILE_BYTES) throw new Error('File too large');
    return encoded;
  } finally {
    key.fill(0);
    plaintext.fill(0);
  }
}

export async function decryptVault(encoded: string, password: string): Promise<ManagerConfig> {
  if (Buffer.byteLength(encoded) > MAX_FILE_BYTES) throw new Error('Invalid vault');
  const envelope: unknown = JSON.parse(encoded);
  if (!isRecord(envelope) || envelope.format !== FORMAT) throw new Error('Invalid vault');
  const salt = decode(envelope.salt, 32);
  const iv = decode(envelope.iv, 12);
  const tag = decode(envelope.tag, 16);
  const ciphertext = decode(envelope.ciphertext);
  const key = await deriveKey(password, salt);
  let plaintext: Buffer | undefined;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return parseConfig(JSON.parse(plaintext.toString('utf8')) as unknown);
  } finally {
    key.fill(0);
    plaintext?.fill(0);
  }
}
