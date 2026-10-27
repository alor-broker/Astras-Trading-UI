import {describe, expect, it} from 'vitest';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createRequire} from 'node:module';
import {ManagerConfigFixtures} from '@testing-lib/fixtures/manager-config';
import {decryptVault, encryptVault} from './vault';

async function runElectron(harness: string, directory: string): Promise<number | null> {
  const require = createRequire(resolve('package.json'));
  const executable = require('electron') as string;
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  return new Promise((resolveExit, reject) => {
    const child = spawn(executable, [resolve(harness), directory], {env, windowsHide: true, stdio: 'ignore'});
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Electron smoke timeout')); }, 50000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('exit', code => { clearTimeout(timeout); resolveExit(code); });
  });
}

describe('Manager shell in Electron', () => {
  it('should isolate accounts, block incorrect identity and cancel a pending switch on lock', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'astras-manager-smoke-'));
    await mkdir(join(directory, 'private'));
    await writeFile(join(directory, 'private/clients.enc'), await encryptVault(ManagerConfigFixtures.createConfig(), 'synthetic test password'));
    try {
      const exitCode = await runElectron('scripts/smoke-harness.cjs', directory);
      const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8')) as Record<string, unknown>;

      expect(report.harnessError, JSON.stringify(report)).toBeUndefined();
      expect(exitCode).toBe(0);
      expect(report.initial).toMatchObject({status: 'locked', clients: []});
      expect(report.shellF12).toBe(true);
      expect(report.terminalF12).toBe(true);
      expect(JSON.stringify(report.authLogs)).toContain('[Astras Manager auth]');
      expect(JSON.stringify(report.authLogs)).toContain('client-id-mismatch');
      expect(JSON.stringify(report.authLogs)).not.toContain('synthetic-token');
      expect(report.passwordControl).toMatchObject({type: 'password', label: expect.any(String)});
      expect(report.wrongPassword).toMatchObject({status: 'locked', error: 'unlockError'});
      expect(report.unlocked).toMatchObject({status: 'choose', activeClientId: null});
      expect(JSON.stringify(report.unlocked)).not.toContain('refreshToken');
      expect(report.first).toMatchObject({status: 'ready', activeClientId: 'client-a'});
      expect(report.firstBootstrap).toMatchObject({identity: {refreshToken: 'synthetic-token-a'}, bridge: 'undefined', node: 'undefined'});
      expect(report.firstDestroyed).toBe(true);
      expect(report.second).toMatchObject({status: 'ready', activeClientId: 'client-b'});
      expect(report.selectedLabel).toContain('Client B (client-b)');
      expect(report.separateSession).toBe(true);
      expect(report.persistent).toBe(false);
      expect(report.secondBootstrap).toMatchObject({identity: {refreshToken: 'synthetic-token-b'}, sentinel: null});
      expect(report.returned).toMatchObject({status: 'ready', activeClientId: 'client-a'});
      expect(report.mismatch).toMatchObject({status: 'choose', error: 'identityError', activeClientId: null});
      expect(report.mismatchHasView).toBe(false);
      expect(report.redirect).toMatchObject({status: 'choose', error: 'sessionError'});
      expect(report.locked).toMatchObject({status: 'locked', clients: [], activeClientId: null});
      expect(report.lockedHasView).toBe(false);
      expect(report.requests).toEqual(['synthetic-token-a', 'synthetic-token-b', 'synthetic-token-a', 'synthetic-token-b', 'synthetic-token-a', 'synthetic-token-b']);
    } finally {
      // Only the exact temporary directory created above is removed.
      await rm(directory, {recursive: true, force: true});
    }
  });
});

describe('Encryption tool in Electron', () => {
  it('should generate a compatible vault from the form and handle cancellation, replacement and failure', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'astras-encryptor-$&-smoke-'));
    const config = ManagerConfigFixtures.createConfig();
    await writeFile(join(directory, 'input.json'), JSON.stringify(config));
    try {
      const exitCode = await runElectron('scripts/encryptor-smoke-harness.cjs', directory);
      const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8')) as Record<string, unknown>;

      expect(report.harnessError, JSON.stringify(report)).toBeUndefined();
      expect(exitCode).toBe(0);
      expect(report.masked).toBe(true);
      expect(report.passwordMismatchDialogCalls).toBe(0);
      expect(report.passwordMismatch).toBeTruthy();
      expect(report.duplicate).toMatchObject({status: 'failed', error: 'encryptorConfigError'});
      expect(report.cancelled).toMatchObject({tokenRetained: true, passwordRetained: true});
      expect(report.saved).toMatchObject({rowCount: 1, emptyToken: true, emptyPassword: true, masked: true});
      expect(report.savedMessage).toContain(join(directory, 'clients.enc'));
      expect(report.replaced).toMatchObject({status: 'saved'});
      expect(report.failedSave).toMatchObject({status: 'failed', error: 'encryptorSaveError'});
      expect(report.storage).toEqual({local: 0, session: 0});
      expect(report.networkCalls).toBe(0);
      expect(report.pageOverflow).toBe(false);
      const encrypted = await readFile(join(directory, 'clients.enc'), 'utf8');
      expect(encrypted).not.toContain('synthetic-token');
      expect(await decryptVault(encrypted, 'synthetic test password')).toEqual(config);
      await expect(decryptVault(encrypted, 'incorrect password')).rejects.toThrow();
    } finally {
      await rm(directory, {recursive: true, force: true});
    }
  });
});
