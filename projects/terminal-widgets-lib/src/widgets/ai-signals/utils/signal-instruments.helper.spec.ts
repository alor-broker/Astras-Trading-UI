import {SignalInstrument, SignalInstrumentStatus} from '../services/ai-signals-service.types';
import {SignalInstrumentsHelper} from './signal-instruments.helper';

describe('SignalInstrumentsHelper', () => {
  function createInstrument(overrides: Partial<SignalInstrument> = {}): SignalInstrument {
    return {
      ticker: 'SBER',
      exchange: 'MOEX',
      broker_symbol: 'MOEX:SBER',
      full_ticker: 'SBER:MOEX',
      market_profile: 'moex',
      status: SignalInstrumentStatus.Ok,
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

    expect(SignalInstrumentsHelper.availableTickers(instruments)).toEqual(['GAZP', 'ROSN', 'SBER']);
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

    expect(SignalInstrumentsHelper.availableTickers(instruments)).toEqual(['SBER']);
  });

  it('should include not_ready instruments with a forecast date even without a consensus', () => {
    const instrument = createInstrument({status: SignalInstrumentStatus.NotReady, last_consensus_date: null});

    expect(SignalInstrumentsHelper.availableTickers([instrument])).toEqual(['SBER']);
  });

  it('should return an empty list for missing or empty coverage', () => {
    expect(SignalInstrumentsHelper.availableTickers(undefined)).toEqual([]);
    expect(SignalInstrumentsHelper.availableTickers(null)).toEqual([]);
    expect(SignalInstrumentsHelper.availableTickers([])).toEqual([]);
  });
});
