import { CurrencyFormat, CurrencySettings } from '../models/market-settings.model';
import { formatCurrency, getCurrencySign, getCurrencyFormat } from './formatters';
import { MathHelper } from './math-helper';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    const locale = 'en-US';

    it('should return rounded number as string if formatSettings is null', () => {
      const num = 1234.567;
      expect(formatCurrency(num, locale, null)).toBe(MathHelper.round(num, 2).toString());
      expect(formatCurrency(num, locale, null, 3)).toBe(MathHelper.round(num, 3).toString());
    });

    it('should format with displaySymbol if locale in formatSettings is empty', () => {
      const num = 1234.56;
      const formatSettings: CurrencyFormat = {
        locale: '',
        formatCode: 'USD',
        displaySymbol: 'USD'
      };
      expect(formatCurrency(num, locale, formatSettings)).toBe(`${MathHelper.round(num, 2)} USD`);
    });

    it('should format with displaySymbol if displaySymbol is present', () => {
      const num = 1234.56;
      const formatSettings: CurrencyFormat = {
        locale: 'en-US',
        formatCode: 'USD',
        displaySymbol: 'USD'
      };
      expect(formatCurrency(num, locale, formatSettings)).toBe('1,234.56 USD');
    });

    it('should use Intl.NumberFormat with formatSettings locale and formatCode if displaySymbol is not present', () => {
      const num = 1234.56;
      const formatSettingsEUR: CurrencyFormat = {
        locale: 'de-DE',
        formatCode: 'EUR'
      };
      expect(formatCurrency(num, locale, formatSettingsEUR)).toBe('1,234.56 €');

      const formatSettingsRUB: CurrencyFormat = {
        locale: 'ru-RU',
        formatCode: 'RUB',
      };
      expect(formatCurrency(num, locale, formatSettingsRUB)).toBe('1,234.56 ₽');
    });

    it('should handle cases where currency symbol is not found in parts', () => {
      const num = 1234.56;
      const formatSettings: CurrencyFormat = {
        locale: 'en-US',
        formatCode: 'XYZ',
        displaySymbol: ''
      };

      expect(formatCurrency(num, locale, formatSettings)).toBe('1,234.56 XYZ');
    });

    it('should respect maxFractionDigits', () => {
      const num = 1234.5678;
      const formatSettings: CurrencyFormat = {
        locale: 'en-US',
        formatCode: 'USD',
        displaySymbol: 'USD'
      };
      expect(formatCurrency(num, locale, formatSettings, 3)).toBe('1,234.568 USD');
      expect(formatCurrency(num, locale, formatSettings, 0)).toBe('1,235 USD');
    });
  });

  describe('getCurrencySign', () => {
    it('should return the correct currency symbol', () => {
      const formatSettingsUSD: CurrencyFormat = {
        locale: 'en-US',
        formatCode: 'USD',
        displaySymbol: 'USD'
      };
      expect(getCurrencySign(formatSettingsUSD)).toBe('$');

      const formatSettingsEUR: CurrencyFormat = {
        locale: 'de-DE',
        formatCode: 'EUR',
        displaySymbol: 'EUR'
      };
      expect(getCurrencySign(formatSettingsEUR)).toBe('€');

      const formatSettingsRUB: CurrencyFormat = {
        locale: 'ru-RU',
        formatCode: 'RUB',
        displaySymbol: 'RUB'
      };
      expect(getCurrencySign(formatSettingsRUB)).toBe('₽');
    });
  });

  describe('getCurrencyFormat', () => {
    const baseCurrencyFormat: CurrencyFormat = {
      locale: 'en-US',
      formatCode: 'USD',
      displaySymbol: 'USD'
    };
    const eurCurrencyFormat: CurrencyFormat = {
      locale: 'de-DE',
      formatCode: 'EUR',
      displaySymbol: 'EUR'
    };
    const currencySettings: CurrencySettings = {
      defaultCurrencyExchange: 'MOEX', // Added missing property
      baseCurrency: 'USD',
      portfolioCurrencies: [
        { positionSymbol: 'USD', format: baseCurrencyFormat, exchangeInstrument: { symbol: 'USD' } },
        { positionSymbol: 'EUR', format: eurCurrencyFormat, exchangeInstrument: { symbol: 'EUR' } },
        { positionSymbol: 'GBP', format: null, exchangeInstrument: { symbol: 'GBP' } } // Test case for null format
      ]
    };

    it('should return format for a found currency', () => {
      expect(getCurrencyFormat('EUR', currencySettings)).toEqual(eurCurrencyFormat);
    });

    it('should return base currency format if currency is not found', () => {
      expect(getCurrencyFormat('JPY', currencySettings)).toEqual(baseCurrencyFormat);
    });

    it('should return base currency format if found currency has null format', () => {
      expect(getCurrencyFormat('GBP', currencySettings)).toEqual(baseCurrencyFormat);
    });

    it('should return base currency format if currency is the base currency itself', () => {
      expect(getCurrencyFormat('USD', currencySettings)).toEqual(baseCurrencyFormat);
    });
  });
});
