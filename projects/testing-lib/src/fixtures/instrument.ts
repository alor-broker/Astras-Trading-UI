import {
  Instrument,
  InstrumentKey,
  Market
} from '@terminal-core-lib/common/types/instrument.types';

export class InstrumentFixtures {
  /**
   * Builds an {@link InstrumentKey} with sensible defaults.
   * Pass `overrides` to change only the fields a test cares about.
   */
  static createInstrumentKey(overrides: Partial<InstrumentKey> = {}): InstrumentKey {
    return {
      symbol: 'SBER',
      exchange: 'MOEX',
      ...overrides
    };
  }

  /**
   * Builds an {@link Instrument} with sensible defaults.
   */
  static createInstrument(overrides: Partial<Instrument> = {}): Instrument {
    return {
      ...InstrumentFixtures.createInstrumentKey(),
      instrumentGroup: 'TQBR',
      shortName: 'SBER',
      description: 'Sber',
      currency: 'RUB',
      minstep: 0.01,
      market: Market.Fond,
      ...overrides
    };
  }
}
