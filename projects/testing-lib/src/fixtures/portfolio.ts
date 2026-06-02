import {
  MarketType,
  PortfolioExtended,
  PortfolioKey
} from '@terminal-core-lib/common/types/portfolio.types';

export class PortfolioFixtures {
  /**
   * Builds a {@link PortfolioKey} with sensible defaults.
   */
  static createPortfolioKey(overrides: Partial<PortfolioKey> = {}): PortfolioKey {
    return {
      portfolio: 'D1',
      exchange: 'MOEX',
      marketType: MarketType.Stock,
      ...overrides
    };
  }

  /**
   * Builds a {@link PortfolioExtended} (portfolio key + metadata) with sensible defaults.
   */
  static createPortfolioExtended(overrides: Partial<PortfolioExtended> = {}): PortfolioExtended {
    return {
      ...PortfolioFixtures.createPortfolioKey(),
      tks: 'tks',
      market: 'stock',
      agreement: 'AG1',
      isVirtual: false,
      ...overrides
    };
  }
}
