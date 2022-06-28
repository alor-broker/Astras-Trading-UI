export interface PortfolioKey {
  portfolio: string,
  exchange: string
}

export class PortfolioKeyEqualityComparer {
  public static equals(a: PortfolioKey, b: PortfolioKey) {
    return a?.portfolio === b?.portfolio && a?.exchange === b?.exchange;
  }
}
