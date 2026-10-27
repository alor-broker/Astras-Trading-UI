import {randomUUID} from 'node:crypto';
import {open, rename, rm} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';

/** Stage only ciphertext; replacing a file never truncates the previous vault. */
export async function saveEncryptedFile(destination: string, encrypted: string): Promise<void> {
  const staging = join(dirname(destination), `.${basename(destination)}.${randomUUID()}.tmp`);
  const file = await open(staging, 'wx', 0o600);
  try {
    try {
      await file.writeFile(encrypted, 'utf8');
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(staging, destination);
  } finally {
    await rm(staging, {force: true});
  }
}
