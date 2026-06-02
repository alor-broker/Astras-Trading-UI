import {PortfolioHelper} from './portfolio.helper';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';

const createPortfolio = PortfolioFixtures.createPortfolioExtended;

describe('PortfolioHelper', () => {
  describe('groupPortfoliosByAgreement', () => {
    it('should group portfolios under their agreement', () => {
      const a1 = createPortfolio({portfolio: 'D1', agreement: 'AG1'});
      const a2 = createPortfolio({portfolio: 'D2', agreement: 'AG1'});
      const b1 = createPortfolio({portfolio: 'D3', agreement: 'AG2'});

      const result = PortfolioHelper.groupPortfoliosByAgreement([a1, a2, b1]);

      expect(result.get('AG1')).toEqual([a1, a2]);
      expect(result.get('AG2')).toEqual([b1]);
    });

    it('should order agreement keys alphabetically', () => {
      const result = PortfolioHelper.groupPortfoliosByAgreement([
        createPortfolio({agreement: 'B'}),
        createPortfolio({agreement: 'A'}),
        createPortfolio({agreement: 'C'})
      ]);

      expect(Array.from(result.keys())).toEqual(['A', 'B', 'C']);
    });

    it('should sort portfolios within an agreement by market', () => {
      const stock = createPortfolio({agreement: 'AG1', market: 'stock'});
      const forward = createPortfolio({agreement: 'AG1', market: 'forward'});

      const result = PortfolioHelper.groupPortfoliosByAgreement([stock, forward]);

      expect(result.get('AG1')).toEqual([forward, stock]);
    });

    it('should return an empty map for an empty input', () => {
      expect(PortfolioHelper.groupPortfoliosByAgreement([]).size).toBe(0);
    });
  });
});
