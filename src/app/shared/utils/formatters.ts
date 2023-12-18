import {
  CurrencyFormat,
  CurrencySettings
} from "../models/market-settings.model";
import { MathHelper } from "./math-helper";

/**
 *  Currency pipe and angular's formatCurrency throws error, while formating rubles without fraction part. =(
 * @param number A number with amount
 * @param formatSettings a currency format settings
 * @param maxFractionDigits number of digits
 * @returns formated number
 */
export function formatCurrency(number: number, formatSettings: CurrencyFormat | null, maxFractionDigits = 2): string {
  if(formatSettings == null) {
    return MathHelper.round(number, maxFractionDigits).toString();
  }

  if (formatSettings.locale === 'ch') {
    return Intl.NumberFormat(formatSettings.locale).format(number) + ' ₣';
  }

  return Intl.NumberFormat(formatSettings.locale, { style: 'currency', currency: formatSettings.formatCode, maximumFractionDigits: maxFractionDigits }).format(number);
}

export function getCurrencySign(formatSettings: CurrencyFormat): string {
  let symbol = '';

  Intl.NumberFormat(formatSettings.locale, {
    style: 'currency',
    currency: formatSettings.formatCode,
  })
    .formatToParts(0).forEach(({ type, value }) => {
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
