import type {ClientEntry} from './contracts';
import {EncryptionError, EncryptionStatus, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type EncryptorBridge} from './encryptor-contracts';
import {dictionary, type Dictionary} from './translations';

declare global {
  interface Window { encryptor: EncryptorBridge; }
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error('Missing encryptor element');
  return found as T;
}

const form = element<HTMLFormElement>('encrypt-form');
const fields = element<HTMLFieldSetElement>('fields');
const rows = element<HTMLDivElement>('client-rows');
const language = element<HTMLSelectElement>('language');
const password = element<HTMLInputElement>('password');
const confirmation = element<HTMLInputElement>('confirmation');
const showTokens = element<HTMLInputElement>('show-tokens');
const addButton = element<HTMLButtonElement>('add-client');
const template = element<HTMLTemplateElement>('client-template');
let sequence = 0;
let busy = false;
let message: keyof Dictionary | null = null;
let error: EncryptionError | null = null;
let savedPath = '';
language.value = ['ru', 'hy'].includes(navigator.language.slice(0, 2)) ? navigator.language.slice(0, 2) : 'en';
password.minLength = confirmation.minLength = MIN_PASSWORD_LENGTH;
password.maxLength = confirmation.maxLength = MAX_PASSWORD_LENGTH;

function text(key: keyof Dictionary): string {
  return dictionary(language.value)[key].replace('{min}', String(MIN_PASSWORD_LENGTH)).replace('{path}', () => savedPath);
}

function render(): void {
  document.documentElement.lang = language.value;
  document.title = text('encryptorTitle');
  document.querySelectorAll<HTMLElement>('[data-key]').forEach(item => {
    item.textContent = text(item.dataset.key as keyof Dictionary);
  });
  rows.querySelectorAll('legend').forEach((legend, index) => {
    legend.textContent = `${text('client')} ${index + 1}`;
  });
  rows.querySelectorAll<HTMLButtonElement>('.remove-client').forEach(button => {
    button.disabled = rows.childElementCount === 1;
  });
  addButton.disabled = rows.childElementCount >= 1000;
  fields.disabled = busy;
  language.disabled = busy;
  form.setAttribute('aria-busy', String(busy));
  element('result').textContent = message ? text(message) : '';
  element('error').textContent = error ? text(error) : '';
}

function addClient(focus = true): void {
  if (rows.childElementCount >= 1000) return;
  const row = template.content.firstElementChild!.cloneNode(true) as HTMLFieldSetElement;
  const rowId = ++sequence;
  row.querySelectorAll<HTMLInputElement>('input').forEach((input, index) => {
    input.id = `client-${rowId}-${index}`;
    const label = input.previousElementSibling as HTMLLabelElement;
    label.htmlFor = input.id;
  });
  row.querySelector<HTMLInputElement>('.client-token')!.type = showTokens.checked ? 'text' : 'password';
  row.querySelector<HTMLButtonElement>('.remove-client')!.addEventListener('click', () => {
    if (busy || rows.childElementCount === 1) return;
    row.remove();
    render();
    addButton.focus();
  });
  rows.append(row);
  render();
  if (focus) row.querySelector<HTMLInputElement>('input')!.focus();
}

function clearSensitiveFields(): void {
  rows.querySelectorAll<HTMLInputElement>('input').forEach(input => { input.value = ''; });
  rows.replaceChildren();
  password.value = '';
  confirmation.value = '';
  showTokens.checked = false;
  addClient(false);
}

async function generate(): Promise<void> {
  if (busy) return;
  error = null;
  savedPath = '';
  if (password.value !== confirmation.value || password.value.length < MIN_PASSWORD_LENGTH) {
    error = EncryptionError.Password;
    message = null;
    render();
    confirmation.focus();
    return;
  }
  busy = true;
  message = 'encryptorWorking';
  render();
  let clients: ClientEntry[] = Array.from(rows.querySelectorAll<HTMLFieldSetElement>('.client-row'), row => ({
    displayName: row.querySelector<HTMLInputElement>('.client-name')!.value.trim(),
    clientId: row.querySelector<HTMLInputElement>('.client-id')!.value.trim(),
    refreshToken: row.querySelector<HTMLInputElement>('.client-token')!.value.trim()
  }));
  try {
    const response = await window.encryptor.save({
      config: {
        schemaVersion: 1,
        terminalUrl: element<HTMLInputElement>('terminal-url').value.trim(),
        clientDataUrl: element<HTMLInputElement>('api-url').value.trim(),
        clients
      },
      password: password.value,
      confirmation: confirmation.value,
      locale: language.value
    });
    if (response.status === EncryptionStatus.Saved) {
      savedPath = response.filePath ?? '';
      message = 'encryptorSaved';
      clearSensitiveFields();
    } else if (response.status === EncryptionStatus.Cancelled) {
      message = 'encryptorCancelled';
    } else {
      message = null;
      error = response.error ?? EncryptionError.Save;
    }
  } catch {
    message = null;
    error = EncryptionError.Save;
  } finally {
    clients = [];
    busy = false;
    render();
    if (message === 'encryptorSaved') element('result').focus();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  void generate();
});
addButton.addEventListener('click', () => { if (!busy) addClient(); });
element('clear').addEventListener('click', () => {
  if (busy) return;
  message = null;
  error = null;
  savedPath = '';
  clearSensitiveFields();
  rows.querySelector<HTMLInputElement>('input')!.focus();
});
showTokens.addEventListener('change', () => {
  rows.querySelectorAll<HTMLInputElement>('.client-token').forEach(input => {
    input.type = showTokens.checked ? 'text' : 'password';
  });
});
language.addEventListener('change', render);
addClient(false);
