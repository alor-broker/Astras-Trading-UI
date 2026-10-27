import {Failure, Status, type ShellBridge, type ShellState} from './contracts';
import {dictionary} from './translations';

declare global {
  interface Window { manager: ShellBridge; }
}

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error('Missing shell element');
  return result as T;
}

const language = element<HTMLSelectElement>('language');
const password = element<HTMLInputElement>('password');
const client = element<HTMLSelectElement>('client');
const form = element<HTMLFormElement>('unlock-form');
const unlock = element<HTMLButtonElement>('unlock');
const lock = element<HTMLButtonElement>('lock');
language.value = ['ru', 'hy'].includes(navigator.language.slice(0, 2)) ? navigator.language.slice(0, 2) : 'en';
let state: ShellState = {status: Status.Locked, error: Failure.None, clients: [], activeClientId: null};

function render(): void {
  const t = dictionary(language.value);
  document.documentElement.lang = language.value;
  document.title = t.title;
  for (const [id, text] of Object.entries({
    title: t.title, 'client-label': t.client, 'language-label': t.language,
    'password-label': t.password, unlock: t.unlock, lock: t.lock
  })) element(id).textContent = text;
  const locked = state.status === Status.Locked || state.status === Status.Unlocking;
  element('accounts').hidden = locked;
  form.hidden = !locked;
  element('welcome').hidden = state.status === Status.Ready;
  unlock.disabled = state.status === Status.Unlocking;
  password.disabled = state.status === Status.Unlocking;
  client.disabled = state.status === Status.Switching;
  const active = state.clients.find(item => item.clientId === state.activeClientId);
  element('status').textContent = active ? `${t.ready}: ${active.displayName} (${active.clientId})` : t[state.status];
  element('error').textContent = state.error === Failure.None ? '' : t[state.error];
  client.replaceChildren(new Option(t.choose, ''), ...state.clients.map(item =>
    new Option(`${item.displayName} (${item.clientId})`, item.clientId)
  ));
  client.value = state.activeClientId ?? '';
}

function accept(next: ShellState): void {
  const wasLocked = state.status === Status.Locked;
  state = next;
  render();
  if (state.status === Status.Locked && !wasLocked) password.focus();
}

function reportBridgeFailure(): void {
  state = {...state, error: Failure.Session};
  render();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const value = password.value;
  password.value = '';
  unlock.disabled = true;
  void window.manager.unlock(value).catch(reportBridgeFailure);
});
client.addEventListener('change', () => {
  if (client.value !== '') void window.manager.selectClient(client.value).catch(reportBridgeFailure);
});
lock.addEventListener('click', () => { void window.manager.lock().catch(reportBridgeFailure); });
language.addEventListener('change', render);
const unsubscribe = window.manager.onState(accept);
window.addEventListener('beforeunload', unsubscribe, {once: true});
void window.manager.getState().then(accept).catch(reportBridgeFailure);
render();
password.focus();
