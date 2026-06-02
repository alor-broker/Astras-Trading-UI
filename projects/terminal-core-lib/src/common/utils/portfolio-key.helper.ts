import {
  MarketType,
  PortfolioKey
} from '../types/portfolio.types';

export class PortfolioKeyEqualityComparer {
  public static equals(a?: PortfolioKey | null, b?: PortfolioKey | null): boolean {
    return a?.portfolio === b?.portfolio && a?.exchange === b?.exchange
      && a?.marketType == b?.marketType;
  }
}

export class PortfolioKeyHelper {
  static getDefaultPortfolio(allPortfolios: PortfolioKey[], defaultExchange: string | null): PortfolioKey | null {
    let suitablePortfolios = allPortfolios;
    if (defaultExchange != null) {
      const exchangeFilteredPortfolios = suitablePortfolios.filter(x => x.exchange === defaultExchange);
      if (exchangeFilteredPortfolios.length > 0) {
        suitablePortfolios = exchangeFilteredPortfolios;
      }
    }

    const typeFilteredPortfolios = suitablePortfolios.filter(x => x.marketType === MarketType.Stock);
    if (typeFilteredPortfolios.length > 0) {
      suitablePortfolios = typeFilteredPortfolios;
    }

    return suitablePortfolios.length > 0
      ? suitablePortfolios[0]
      : null;
  }

  static getMarketTypeByPortfolio(portfolio: string): MarketType | undefined {
    if (portfolio.startsWith('D')) {
      return MarketType.Stock;
    }

    if (portfolio.startsWith('G')) {
      return MarketType.ForeignExchange;
    }

    if (portfolio.startsWith('E')) {
      return MarketType.United;
    }

    if (/^\d/.test(portfolio)) {
      return MarketType.Forward;
    }

    return undefined;
  }
}
