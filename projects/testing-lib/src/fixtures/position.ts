import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {InstrumentFixtures} from './instrument';
import {PortfolioFixtures} from './portfolio';

export class PositionFixtures {
  /**
   * Builds a {@link Position} with sensible defaults.
   * All numeric quantities default to 0 so tests only set what they assert on.
   */
  static createPosition(overrides: Partial<Position> = {}): Position {
    return {
      brokerSymbol: 'MOEX:SBER',
      avgPrice: 100,
      qtyUnits: 0,
      openUnits: 0,
      lotSize: 1,
      shortName: 'Сбербанк',
      qtyT0: 0,
      qtyT1: 0,
      qtyT2: 0,
      qtyTFuture: 0,
      qtyT0Batch: 0,
      qtyT1Batch: 0,
      qtyT2Batch: 0,
      qtyTFutureBatch: 0,
      qtyBatch: 0,
      openQtyBatch: 0,
      qty: 0,
      open: 0,
      dailyUnrealisedPl: 0,
      unrealisedPl: 0,
      isCurrency: false,
      volume: 0,
      currentVolume: 0,
      ownedPortfolio: PortfolioFixtures.createPortfolioKey(),
      targetInstrument: InstrumentFixtures.createInstrumentKey(),
      ...overrides
    };
  }
}
