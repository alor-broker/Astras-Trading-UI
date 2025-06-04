import {
  getMarketTypeByPortfolio,
  formatMarket,
  groupPortfoliosByAgreement,
  isPortfoliosEqual,
  getDefaultPortfolio
} from './portfolios';
import { MarketType, PortfolioKey } from '../models/portfolio-key.model';
import { PortfolioExtended } from '../models/user/portfolio-extended.model';

describe('Portfolios Utils', () => {
  describe('getMarketTypeByPortfolio', () => {
    it('should return Stock for portfolios starting with D', () => {
      expect(getMarketTypeByPortfolio('D123')).toBe(MarketType.Stock);
      expect(getMarketTypeByPortfolio('D')).toBe(MarketType.Stock);
    });

    it('should return ForeignExchange for portfolios starting with G', () => {
      expect(getMarketTypeByPortfolio('G123')).toBe(MarketType.ForeignExchange);
      expect(getMarketTypeByPortfolio('G')).toBe(MarketType.ForeignExchange);
    });

    it('should return United for portfolios starting with E', () => {
      expect(getMarketTypeByPortfolio('E123')).toBe(MarketType.United);
      expect(getMarketTypeByPortfolio('E')).toBe(MarketType.United);
    });

    it('should return Forward for portfolios starting with a digit', () => {
      expect(getMarketTypeByPortfolio('12345')).toBe(MarketType.Forward);
      expect(getMarketTypeByPortfolio('0ABC')).toBe(MarketType.Forward);
    });

    it('should return undefined for other portfolios', () => {
      expect(getMarketTypeByPortfolio('ABC')).toBeUndefined();
      expect(getMarketTypeByPortfolio('')).toBeUndefined();
      expect(getMarketTypeByPortfolio('X123')).toBeUndefined();
    });
  });

  describe('formatMarket', () => {
    it('should format "Фондовый рынок" correctly', () => {
      expect(formatMarket('Фондовый рынок', 'MOEX')).toBe('Фонд MOEX');
    });

    it('should return the market as is if it does not start with "Фондовый"', () => {
      expect(formatMarket('Валютный рынок', 'MOEX')).toBe('Валютный');
      expect(formatMarket('Срочный рынок', 'MOEX')).toBe('Срочный');
    });
  });

  describe('groupPortfoliosByAgreement', () => {
    const portfolios: PortfolioExtended[] = [
      { agreement: 'A1', portfolio: 'P1', market: 'M1', exchange: 'E1', marketType: MarketType.Stock, tks: 'TKS1', isVirtual: false },
      { agreement: 'A2', portfolio: 'P2', market: 'M2', exchange: 'E2', marketType: MarketType.ForeignExchange, tks: 'TKS2', isVirtual: false },
      { agreement: 'A1', portfolio: 'P3', market: 'M0', exchange: 'E3', marketType: MarketType.Forward, tks: 'TKS3', isVirtual: true },
    ];

    it('should group portfolios by agreement', () => {
      const grouped = groupPortfoliosByAgreement(portfolios);
      expect(grouped.size).toBe(2);
      expect(grouped.get('A1')?.length).toBe(2);
      expect(grouped.get('A2')?.length).toBe(1);
    });

    it('should sort agreements alphabetically', () => {
      const agreements = ['C', 'A', 'B'];
      const testPortfolios: PortfolioExtended[] = agreements.map(ag => ({
        agreement: ag, portfolio: `P-${ag}`, market: 'M', exchange: 'E', marketType: MarketType.Stock, tks: `TKS-${ag}`, isVirtual: false
      } as PortfolioExtended));

      const grouped = groupPortfoliosByAgreement(testPortfolios);
      const keys = Array.from(grouped.keys());
      expect(keys).toEqual(['A', 'B', 'C']);
    });

    it('should sort portfolios within each agreement by market', () => {
      const testPortfolios: PortfolioExtended[] = [
        { agreement: 'A1', portfolio: 'P1', market: 'ZMarket', exchange: 'E1', marketType: MarketType.Stock, tks: 'TKS1', isVirtual: false } as PortfolioExtended,
        { agreement: 'A1', portfolio: 'P2', market: 'AMarket', exchange: 'E2', marketType: MarketType.Stock, tks: 'TKS2', isVirtual: false } as PortfolioExtended,
      ];
      const grouped = groupPortfoliosByAgreement(testPortfolios);
      const a1Portfolios = grouped.get('A1');
      expect(a1Portfolios?.[0]?.market).toBe('AMarket');
      expect(a1Portfolios?.[1]?.market).toBe('ZMarket');
    });

    it('should handle empty input', () => {
      const grouped = groupPortfoliosByAgreement([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('isPortfoliosEqual', () => {
    const p1: PortfolioKey = { portfolio: 'P1', exchange: 'E1', marketType: MarketType.Stock };
    const p1Clone: PortfolioKey = { portfolio: 'P1', exchange: 'E1', marketType: MarketType.Stock };
    const p2: PortfolioKey = { portfolio: 'P2', exchange: 'E1', marketType: MarketType.Stock };
    const p3: PortfolioKey = { portfolio: 'P1', exchange: 'E2', marketType: MarketType.Stock };
    const p4: PortfolioKey = { portfolio: 'P1', exchange: 'E1', marketType: MarketType.ForeignExchange };

    it('should return true for equal portfolios', () => {
      expect(isPortfoliosEqual(p1, p1Clone)).toBeTrue();
    });

    it('should return false for different portfolios (portfolio property)', () => {
      expect(isPortfoliosEqual(p1, p2)).toBeFalse();
    });

    it('should return false for different portfolios (exchange property)', () => {
      expect(isPortfoliosEqual(p1, p3)).toBeFalse();
    });

    it('should return false for different portfolios (marketType property)', () => {
      expect(isPortfoliosEqual(p1, p4)).toBeFalse();
    });

    it('should handle null inputs', () => {
      expect(isPortfoliosEqual(null, p1)).toBeFalse();
      expect(isPortfoliosEqual(p1, null)).toBeFalse();
      expect(isPortfoliosEqual(null, null)).toBeTrue();
    });
  });

  describe('getDefaultPortfolio', () => {
    const portfolios: PortfolioKey[] = [
      { portfolio: 'P1', exchange: 'E1', marketType: MarketType.Stock },
      { portfolio: 'P2', exchange: 'E2', marketType: MarketType.Stock },
      { portfolio: 'P3', exchange: 'E1', marketType: MarketType.ForeignExchange },
      { portfolio: 'P4', exchange: 'E2', marketType: MarketType.Forward },
      { portfolio: 'P5', exchange: 'E1', marketType: MarketType.Stock }, // Another stock on E1
    ];

    it('should return the first stock portfolio on the default exchange if specified and available', () => {
      const defaultPortfolio = getDefaultPortfolio(portfolios, 'E1');
      expect(defaultPortfolio).toEqual(portfolios[0]);
    });

    it('should return the first stock portfolio if default exchange is specified but no portfolios match it', () => {
      const defaultPortfolio = getDefaultPortfolio(portfolios, 'E3'); // No portfolios on E3
      expect(defaultPortfolio).toEqual(portfolios[0]); // Falls back to first stock overall
    });

    it('should return the first stock portfolio if default exchange is null', () => {
      const defaultPortfolio = getDefaultPortfolio(portfolios, null);
      expect(defaultPortfolio).toEqual(portfolios[0]);
    });

    it('should return the first portfolio overall if no stock portfolios are available', () => {
      const nonStockPortfolios: PortfolioKey[] = [
        { portfolio: 'P3', exchange: 'E1', marketType: MarketType.ForeignExchange },
        { portfolio: 'P4', exchange: 'E2', marketType: MarketType.Forward },
      ];
      const defaultPortfolio = getDefaultPortfolio(nonStockPortfolios, 'E1');
      expect(defaultPortfolio).toEqual(nonStockPortfolios[0]);
    });

    it('should return null if no portfolios are provided', () => {
      const defaultPortfolio = getDefaultPortfolio([], 'E1');
      expect(defaultPortfolio).toBeNull();
    });
  });
});
