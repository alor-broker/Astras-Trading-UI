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
  switch (currency) {
    case CurrencyInstrument.USD:
      formatCode = 'USD';
      locale = 'en';
      break;
    case CurrencyInstrument.EUR:
      formatCode = 'EUR';
      locale = 'de';
      break;
    case CurrencyInstrument.CHF:
      formatCode = 'CHF';
      locale = 'ch';
      break;
    case CurrencyInstrument.CNY:
      formatCode = 'CNY';
      locale = 'zh';
      break;
    case CurrencyInstrument.TRY:
      formatCode = 'TRY';
      locale = 'tr';
      break;
    case CurrencyInstrument.HKD:
      formatCode = 'HKD';
      locale = 'zh-hk';
      break;
  }

  if (locale === 'ch') {
    return Intl.NumberFormat(locale).format(number) + ' ₣';
  }

  return Intl.NumberFormat(locale, { style: 'currency', currency: formatCode, maximumFractionDigits: maxFractionDigits }).format(number);
}
