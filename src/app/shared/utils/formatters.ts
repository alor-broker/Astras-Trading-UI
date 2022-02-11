import { Currency } from "../models/enums/currencies.model";
import { MathHelper } from "./math-helper";

export function formatCurrency(number: number, currency: string, maxFractionDigits?: number) {
  if (!maxFractionDigits) {
    maxFractionDigits = 2;
  }
  let formatCode = 'RUB';
  let locale = 'ru'
  if (currency == Currency.Usd) {
    formatCode = 'USD'
    locale = 'en'
  }
  else if (currency == Currency.Eur) {
    formatCode = 'EUR'
    locale = 'de'
  }
  return Intl.NumberFormat(locale, { style: 'currency', currency: formatCode, maximumFractionDigits: maxFractionDigits }).format(number);
}
