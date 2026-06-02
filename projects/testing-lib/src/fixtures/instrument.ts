import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

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
}
