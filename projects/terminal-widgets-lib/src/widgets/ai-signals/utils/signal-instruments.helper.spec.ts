import {SignalInstrument} from '../services/ai-signals-service.types';
import {SignalInstrumentsHelper} from './signal-instruments.helper';

describe('SignalInstrumentsHelper', () => {
  function createInstrument(overrides: Partial<SignalInstrument> = {}): SignalInstrument {
    return {
      ticker: 'SBER',
      exchange: 'MOEX',
      last_forecast_date: '2026-09-04',
      ...overrides
    };
  }

  it('should sort and deduplicate normalized tickers without modifying the response', () => {
    const instruments = [
      createInstrument({ticker: ' sber '}),
      createInstrument({ticker: 'ROSN'}),
      createInstrument({ticker: 'GAZP'}),
      createInstrument({ticker: 'SBER'})
    ];
    const original = structuredClone(instruments);

    expect(SignalInstrumentsHelper.availableInstruments(instruments)).toEqual([
      {ticker: 'GAZP', exchange: 'MOEX'},
      {ticker: 'ROSN', exchange: 'MOEX'},
      {ticker: 'SBER', exchange: 'MOEX'}
    ]);
    expect(instruments).toEqual(original);
  });

  it('should omit instruments without a last forecast date or ticker', () => {
    const instruments = [
      createInstrument({ticker: 'MISSING', last_forecast_date: undefined}),
      createInstrument({ticker: 'NULL', last_forecast_date: null}),
      createInstrument({ticker: 'EMPTY', last_forecast_date: ''}),
      createInstrument({ticker: 'BLANK', last_forecast_date: '  '}),
      createInstrument({ticker: ' '}),
      createInstrument()
    ];

    expect(SignalInstrumentsHelper.availableInstruments(instruments)).toEqual([{ticker: 'SBER', exchange: 'MOEX'}]);
  });

  it('should return an empty list for missing or empty coverage', () => {
    expect(SignalInstrumentsHelper.availableInstruments(undefined)).toEqual([]);
    expect(SignalInstrumentsHelper.availableInstruments(null)).toEqual([]);
    expect(SignalInstrumentsHelper.availableInstruments([])).toEqual([]);
  });

  it('should resolve selections by exchange and ticker', () => {
    const available = SignalInstrumentsHelper.availableInstruments([
      createInstrument({ticker: 'SBER', exchange: 'MOEX'}),
      createInstrument({ticker: 'AAPL', exchange: 'ITS'})
    ]);

    expect(SignalInstrumentsHelper.resolveAvailableInstruments([
      {ticker: 'aapl', exchange: 'its'},
      {ticker: 'SBER', exchange: 'MOEX'}
    ], available)).toEqual([
      {ticker: 'AAPL', exchange: 'ITS'},
      {ticker: 'SBER', exchange: 'MOEX'}
    ]);
  });
});
