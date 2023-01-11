import { MarketType } from "../models/portfolio-key.model";
import { PortfolioExtended } from '../models/user/portfolio-extended.model';

export function getMarketTypeByPortfolio(portfolio: string): MarketType | undefined {
  if (portfolio.startsWith('D')) {
    return MarketType.Stock;
  }

  if (portfolio.startsWith('G')) {
    return MarketType.ForeignExchange;
  }

  if (/^\d/.test(portfolio)) {
    return MarketType.Forward;
  }

  return undefined;
}

export function formatMarket(market: string, exchange: string) {
  market = market.split(' ')[0];
  if (market.startsWith('Фондовый')) {
    return `${market.slice(0, 4)} ${exchange}`;
  }
  return `${market}`;
}

export function groupPortfoliosByAgreement(portfolios: PortfolioExtended[]): Map<string, PortfolioExtended[]> {
  const extendedPortfoliosByAgreement = new Map<string, PortfolioExtended[]>();

  portfolios.forEach(value => {
    const existing = extendedPortfoliosByAgreement.get(value.agreement);
    if (existing) {
      existing.push(value);
    }
    else {
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
