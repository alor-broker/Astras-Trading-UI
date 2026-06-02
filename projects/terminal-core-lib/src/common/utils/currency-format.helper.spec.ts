import {CurrencyFormatHelper} from './currency-format.helper';
import {
  CurrencyFormat,
  CurrencySettings
} from '../../features/market-config/market-config.types';

describe('CurrencyFormatHelper', () => {
  const rubFormat: CurrencyFormat = {formatCode: 'RUB', locale: 'ru-RU'};
  const usdFormat: CurrencyFormat = {formatCode: 'USD', locale: 'en-US'};

  function createSettings(): CurrencySettings {
    return {
      defaultCurrencyExchange: 'MOEX',
      baseCurrency: 'RUB',
      portfolioCurrencies: [
        {positionSymbol: 'RUB', exchangeInstrument: null, format: rubFormat},
        {positionSymbol: 'USD', exchangeInstrument: null, format: usdFormat}
      ]
    };
  }

  describe('getCurrencyFormat', () => {
    it('should return the format of the matching currency', () => {
      expect(CurrencyFormatHelper.getCurrencyFormat('USD', createSettings())).toBe(usdFormat);
    });

    it('should fall back to the base currency format when the currency is unknown', () => {
      expect(CurrencyFormatHelper.getCurrencyFormat('EUR', createSettings())).toBe(rubFormat);
    });
  });

  describe('formatCurrency', () => {
    it('should round the number and ignore symbols when there is no format', () => {
      expect(CurrencyFormatHelper.formatCurrency(123.456, 'ru-RU', null)).toBe('123.46');
    });

    it('should append the display symbol with a rounded number when locale is empty', () => {
      const format: CurrencyFormat = {formatCode: 'RUB', locale: '', displaySymbol: '₽'};

      expect(CurrencyFormatHelper.formatCurrency(100.5, 'ru-RU', format)).toBe('100.5 ₽');
    });
  });
});
