export enum FundamentalMetric {
  Revenue = 'Revenue',
  GrossProfit = 'GrossProfit',
  OperatingIncome = 'OperatingIncome',
  Ebitda = 'EBITDA',
  NetIncome = 'NetIncome',
  NetIncomeOwner = 'netIncomeOwner',
  TotalAssets = 'TotalAssets',
  TotalEquity = 'TotalEquity',
  NetDebt = 'NetDebt',
  TotalDebt = 'totalDebt',
  CashEquivalents = 'cash_equivalents',
  OperatingCashflow = 'OperatingCashflow',
  Capex = 'Capex',
  FinancialCashflow = 'FinancialCashflow',
  Dividend = 'Dividend',
  Buyback = 'Buyback',
  FinRevenue = 'FinRevenue',
  FinPercentIncomeNet = 'FinPercentIncomeNet',
  FinCommissionIncomeNet = 'FinCommissionIncomeNet',
  FinReserveForCreditLoss = 'FinReserveForCreditLoss',
  FinIncomeNet = 'FinIncomeNet',
  FinPortfolioCredit = 'FinPortfolioCredit',
  FinDeposits = 'FinDeposits'
}

export enum FundamentalGroup {
  Income = 'income',
  Balance = 'balance',
  Cashflow = 'cashflow',
  Banking = 'banking',
  Other = 'other'
}

export interface FundamentalMetricLabel {
  key: string;
  labelKey: string | null;
}

export interface FundamentalMetricViewModel extends FundamentalMetricLabel {
  value: number | null;
  yoyPercent: number | null;
}

export interface FundamentalTrendPoint {
  period: string;
  value: number | null;
}

export interface FundamentalTrendViewModel extends FundamentalMetricLabel {
  points: FundamentalTrendPoint[];
}

export interface FundamentalViewModel {
  currency: string | null;
  reportPeriod: string | null;
  disclosed: string | null;
  statement: string | null;
  statementLabelKey: string | null;
  decisionDate: string | null;
  isBank: boolean;
  groups: {key: FundamentalGroup, rows: FundamentalMetricViewModel[]}[];
  trends: FundamentalTrendViewModel[];
  valuation: {evEbitda: number, asOf: string | null} | null;
  dividend: {value: number, period: string | null} | null;
  absent: FundamentalMetricLabel[];
  notes: string[];
}
