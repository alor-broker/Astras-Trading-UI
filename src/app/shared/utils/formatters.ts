import { CurrencyInstrument } from "../models/enums/currencies.model";

/**
 *  Currency pipe and angular's formatCurrency throws error, while formating rubles without fraction part. =(
 * @param number A number with amount
 * @param currency a currency code (look at CurrencyInstrument)
 * @param maxFractionDigits number of digits
 * @returns formated number
 */
export function formatCurrency(number: number, currency: string, maxFractionDigits = 2) {
  const localeData = getLocaleDataByCurrency(currency);

  if (localeData.locale === 'ch') {
    return Intl.NumberFormat(localeData.locale).format(number) + ' ₣';
  }

  return Intl.NumberFormat(localeData.locale, { style: 'currency', currency: localeData.formatCode, maximumFractionDigits: maxFractionDigits }).format(number);
}

export function getCurrencySign(currency: string): string {
  const localeData = getLocaleDataByCurrency(currency);
  let symbol = '';

  Intl.NumberFormat(localeData.locale, {
    style: 'currency',
    currency,
  })
    .formatToParts(0).forEach(({ type, value }) => {
    if (type === 'currency') {
      symbol = value;
    }
  });

  return symbol;
}

function getLocaleDataByCurrency(currency: CurrencyInstrument) {
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

  return {
    formatCode,
    locale
  };
}
