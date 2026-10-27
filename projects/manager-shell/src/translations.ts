import en from '../public/assets/i18n/en.json';
import ru from '../public/assets/i18n/ru.json';
import hy from '../public/assets/i18n/hy.json';

export type Dictionary = typeof en;

export function dictionary(locale: string): Dictionary {
  if (locale.startsWith('ru')) return ru;
  if (locale.startsWith('hy')) return hy;
  return en;
}
