import {PortfolioExtended} from '../types/portfolio.types';

export class PortfolioHelper {
  static groupPortfoliosByAgreement(portfolios: PortfolioExtended[]): Map<string, PortfolioExtended[]> {
    const extendedPortfoliosByAgreement = new Map<string, PortfolioExtended[]>();

    portfolios.forEach(value => {
      const existing = extendedPortfoliosByAgreement.get(value.agreement);
      if (existing) {
        existing.push(value);
      } else {
        extendedPortfoliosByAgreement.set(value.agreement, [value]);
      }
    });

    const sortedPortfolios = new Map<string, PortfolioExtended[]>();
    Array.from(extendedPortfoliosByAgreement.keys())
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        const portfolios = extendedPortfoliosByAgreement.get(key)?.sort((a, b) => a.market.localeCompare(b.market)) ?? [];
        sortedPortfolios.set(key, portfolios);
      });

    return sortedPortfolios;
  }
}
