import {
  PortfolioKeyEqualityComparer,
  PortfolioKeyHelper
} from './portfolio-key.helper';
import {MarketType} from '../types/portfolio.types';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';

describe('portfolio-key.helper', () => {
  describe('PortfolioKeyEqualityComparer', () => {
    const base = PortfolioFixtures.createPortfolioKey({portfolio: 'D1234', exchange: 'MOEX', marketType: MarketType.Stock});

    it('should return true for portfolios with the same key fields', () => {
      expect(PortfolioKeyEqualityComparer.equals(base, {...base})).toBe(true);
    });

    it('should return false when the portfolio differs', () => {
      expect(PortfolioKeyEqualityComparer.equals(base, {...base, portfolio: 'D9999'})).toBe(false);
    });

    it('should treat missing and undefined marketType as equal', () => {
      expect(PortfolioKeyEqualityComparer.equals(
        {portfolio: 'D1234', exchange: 'MOEX'},
        {portfolio: 'D1234', exchange: 'MOEX', marketType: undefined}
      )).toBe(true);
    });

    it('should treat two nulls as equal and null vs portfolio as not equal', () => {
      expect(PortfolioKeyEqualityComparer.equals(null, null)).toBe(true);
      expect(PortfolioKeyEqualityComparer.equals(null, base)).toBe(false);
    });
  });

  describe('PortfolioKeyHelper', () => {
    describe('getDefaultPortfolio', () => {
      const stockMoex = PortfolioFixtures.createPortfolioKey({portfolio: 'D1', exchange: 'MOEX', marketType: MarketType.Stock});
      const forwardMoex = PortfolioFixtures.createPortfolioKey({portfolio: '1', exchange: 'MOEX', marketType: MarketType.Forward});
      const stockSpbx = PortfolioFixtures.createPortfolioKey({portfolio: 'D2', exchange: 'SPBX', marketType: MarketType.Stock});

      it('should return null when there are no portfolios', () => {
        expect(PortfolioKeyHelper.getDefaultPortfolio([], 'MOEX')).toBeNull();
      });

      it('should prefer a portfolio matching the default exchange', () => {
        expect(PortfolioKeyHelper.getDefaultPortfolio([stockSpbx, stockMoex], 'MOEX')).toBe(stockMoex);
      });

      it('should prefer a Stock portfolio within the chosen exchange', () => {
        expect(PortfolioKeyHelper.getDefaultPortfolio([forwardMoex, stockMoex], 'MOEX')).toBe(stockMoex);
      });

      it('should ignore the exchange filter when no portfolio matches it', () => {
        expect(PortfolioKeyHelper.getDefaultPortfolio([stockMoex], 'SPBX')).toBe(stockMoex);
      });

      it('should fall back to the first portfolio when no Stock portfolio exists', () => {
        expect(PortfolioKeyHelper.getDefaultPortfolio([forwardMoex], null)).toBe(forwardMoex);
      });
    });

    describe('getMarketTypeByPortfolio', () => {
      it('should map the "D" prefix to Stock', () => {
        expect(PortfolioKeyHelper.getMarketTypeByPortfolio('D1234')).toBe(MarketType.Stock);
      });

      it('should map the "G" prefix to ForeignExchange', () => {
        expect(PortfolioKeyHelper.getMarketTypeByPortfolio('G1234')).toBe(MarketType.ForeignExchange);
      });

      it('should map the "E" prefix to United', () => {
        expect(PortfolioKeyHelper.getMarketTypeByPortfolio('E1234')).toBe(MarketType.United);
      });

      it('should map a leading digit to Forward', () => {
        expect(PortfolioKeyHelper.getMarketTypeByPortfolio('7500GH')).toBe(MarketType.Forward);
      });

      it('should return undefined for an unrecognized prefix', () => {
        expect(PortfolioKeyHelper.getMarketTypeByPortfolio('XYZ')).toBeUndefined();
      });
    });
  });
});
