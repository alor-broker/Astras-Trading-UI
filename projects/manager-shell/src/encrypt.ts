import {writeFile} from 'node:fs/promises';
import {emitKeypressEvents} from 'node:readline';
import {parseConfig} from './config';
import {encryptVault, readBoundedFile} from './vault';
import {dictionary} from './translations';

const t = dictionary(Intl.DateTimeFormat().resolvedOptions().locale);

function passwordPrompt(label: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('TTY required');
  process.stdout.write(label);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (): void => {
      process.stdin.off('keypress', keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    };
    const keypress = (text: string | undefined, key: {name?: string, ctrl?: boolean}): void => {
      if (key.ctrl && key.name === 'c') {
        finish();
        reject(new Error('Cancelled'));
      } else if (key.name === 'return' || key.name === 'enter') {
        finish();
        resolve(value);
      } else if (key.name === 'backspace') {
        value = Array.from(value).slice(0, -1).join('');
      } else if (text && !/[\u0000-\u001f\u007f]/u.test(text) && value.length + text.length <= 1024) {
        value += text;
      }
    };
    process.stdin.on('keypress', keypress);
  });
}

async function main(): Promise<void> {
  const [, , source, destination] = process.argv;
  if (!source || !destination || process.argv.length !== 4) {
    process.stderr.write(`${t.encryptUsage}\n`);
    process.exitCode = 1;
    return;
  }
  const config = parseConfig(JSON.parse(await readBoundedFile(source)) as unknown);
  let password = await passwordPrompt(`${t.password}: `);
  let confirmation = await passwordPrompt(`${t.confirmPassword}: `);
  if (password.length < 12 || password !== confirmation) {
    process.stderr.write(`${t.passwordRules}\n`);
    process.exitCode = 1;
    return;
  }
  const encrypted = await encryptVault(config, password);
  password = '';
  confirmation = '';
  await writeFile(destination, encrypted, {flag: 'wx', mode: 0o600});
  process.stdout.write(`${t.encrypted}\n`);
}

void main().catch(() => {
  process.stderr.write(`${t.encryptError}\n`);
  process.exitCode = 1;
});
