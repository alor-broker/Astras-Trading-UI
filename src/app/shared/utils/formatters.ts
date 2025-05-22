import {
  CurrencyFormat,
  CurrencySettings
} from "../models/market-settings.model";
import { MathHelper } from "./math-helper";

/**
 *  Currency pipe and angular's formatCurrency throws error, while formating rubles without fraction part. =(
 * @param number A number with amount
 * @param locale A locale for formatting
 * @param formatSettings a currency format settings
 * @param maxFractionDigits number of digits
 * @returns formated number
 */
export function formatCurrency(number: number, locale: string, formatSettings: CurrencyFormat | null, maxFractionDigits = 2): string {
  if(formatSettings == null) {
    return MathHelper.round(number, maxFractionDigits).toString();
  }

  if (formatSettings.displaySymbol != null && formatSettings.displaySymbol.length > 0) {
    if(formatSettings.locale.length == 0) {
      return MathHelper.round(number, maxFractionDigits).toString() + ' ' + formatSettings.displaySymbol;
    }

    return Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(number) + ' ' + formatSettings.displaySymbol;
  }

  const currencyFormat = Intl.NumberFormat(formatSettings.locale, { style: 'currency', currency: formatSettings.formatCode, maximumFractionDigits: maxFractionDigits });
  const parts = currencyFormat.formatToParts(number);
  const currencyIndex = parts.findIndex(p => p.type === 'currency');

  if(currencyIndex < 0) {
    return currencyFormat.format(number);
  }

  return Intl.NumberFormat(locale).format(number) + ' ' + parts[currencyIndex].value;
}

export function getCurrencySign(formatSettings: CurrencyFormat): string {
  let symbol = '';

  Intl.NumberFormat(formatSettings.locale, {
    style: 'currency',
    currency: formatSettings.formatCode,
  })
    .formatToParts().forEach(({ type, value }) => {
    if (type === 'currency') {
      symbol = value;
    }
  });

  return symbol;
}

export function getCurrencyFormat(currency: string, currencySettings: CurrencySettings): CurrencyFormat {
  const foundCurrency = currencySettings.portfolioCurrencies.find(c => c.positionSymbol === currency);

  if(foundCurrency != null && foundCurrency.format != null) {
    return foundCurrency.format;
  }

  return currencySettings.portfolioCurrencies.find(c => c.positionSymbol === currencySettings.baseCurrency)!.format!;
}
