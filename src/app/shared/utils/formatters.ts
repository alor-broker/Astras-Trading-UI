import { CurrencyInstrument } from "../models/enums/currencies.model";

/**
 *  Currency pipe and angular's formatCurrency throws error, while formating rubles without fraction part. =(
 * @param number A number with amount
 * @param currency a currency code (look at CurrencyInstrument)
 * @param maxFractionDigits number of digits
 * @returns formated number
 */
export function formatCurrency(number: number, currency: string, maxFractionDigits?: number) {
  if (!maxFractionDigits) {
    maxFractionDigits = 2;
  }
  let formatCode = 'RUB';
  let locale = 'ru';
  if (currency == CurrencyInstrument.USD) {
    formatCode = 'USD';
    locale = 'en';
  }
  else if (currency == CurrencyInstrument.EUR) {
    formatCode = 'EUR';
    locale = 'de';
  }
  return Intl.NumberFormat(locale, { style: 'currency', currency: formatCode, maximumFractionDigits: maxFractionDigits }).format(number);
}
