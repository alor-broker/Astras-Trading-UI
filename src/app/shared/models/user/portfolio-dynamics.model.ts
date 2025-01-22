export interface PortfolioValue {
  date: Date;
  value: number;
}

export interface PortfolioDynamics {
  portfolioValues: PortfolioValue[];
  assetsSum: number;
  profitablity: number;
  profitablityPct: number;
  dividends: number;
  replenishments: number;
  withdrawals: number;
}
