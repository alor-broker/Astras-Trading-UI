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
