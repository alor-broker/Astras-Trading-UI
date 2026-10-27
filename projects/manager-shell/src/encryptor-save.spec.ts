import {beforeEach, describe, expect, it, vi} from 'vitest';
import {open, rename, rm} from 'node:fs/promises';
import {saveEncryptedFile} from './encryptor-save';

vi.mock('node:fs/promises', () => ({open: vi.fn(), rename: vi.fn(), rm: vi.fn()}));
vi.mock('node:crypto', () => ({randomUUID: () => 'synthetic-stage-id'}));

describe('saveEncryptedFile', () => {
  let file: {writeFile: ReturnType<typeof vi.fn>, sync: ReturnType<typeof vi.fn>, close: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    vi.resetAllMocks();
    file = {writeFile: vi.fn().mockResolvedValue(undefined), sync: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined)};
    vi.mocked(open).mockResolvedValue(file as unknown as Awaited<ReturnType<typeof open>>);
    vi.mocked(rename).mockResolvedValue(undefined);
    vi.mocked(rm).mockResolvedValue(undefined);
  });

  it('should replace the destination only after writing and closing the ciphertext', async () => {
    await saveEncryptedFile('clients.enc', 'encrypted-payload');

    expect(file.writeFile).toHaveBeenCalledWith('encrypted-payload', 'utf8');
    expect(file.sync).toHaveBeenCalledOnce();
    expect(file.close.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(rename).mock.invocationCallOrder[0]!);
    expect(rename).toHaveBeenCalledWith('.clients.enc.synthetic-stage-id.tmp', 'clients.enc');
  });

  it('should leave an existing destination untouched when a write fails', async () => {
    file.writeFile.mockRejectedValue(new Error('Disk full'));

    await expect(saveEncryptedFile('clients.enc', 'encrypted-payload')).rejects.toThrow('Disk full');
    expect(rename).not.toHaveBeenCalled();
    expect(file.close).toHaveBeenCalledOnce();
    expect(rm).toHaveBeenCalledWith('.clients.enc.synthetic-stage-id.tmp', {force: true});
  });

  it('should remove the staged file when replacement fails', async () => {
    vi.mocked(rename).mockRejectedValue(new Error('Access denied'));

    await expect(saveEncryptedFile('clients.enc', 'encrypted-payload')).rejects.toThrow('Access denied');
    expect(rm).toHaveBeenCalledWith('.clients.enc.synthetic-stage-id.tmp', {force: true});
  });
});
