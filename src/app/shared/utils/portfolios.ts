import { MarketType } from "../models/portfolio-key.model";

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
