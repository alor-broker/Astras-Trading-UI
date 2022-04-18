export interface Finance {
  currency: string, // RUB,
  mainIndicators?: {
    marketCap: number, // 6489123123,
    ebitda: number, // 164234324,
  },
  costEstimate?: {
      priceToEarnings: number, // 2.21,
      pricePerShare: number, // 5.34,
      dilutedEarningsPerShare: number, // 50.33
  },
  profitability?: {
      returnOnEquity: number, // 0.2101,
      returnOnAssets: number, // 0.0295,
      debtPerEquity: number, // 0.6273,
      netProfitMargin: number, // 0.3791
  },
  dividends?: {
      payoutRation: number, // 0.5794,
      averageDividendFor5years: number, // 0.0643,
      lastDividendYield: number, // 0.0649
  },
  trading?: {
      closePrice: number, // 250,
      maxFor52Weeks: number, // 257.05,
      minFor52Weeks: number, // 257.05,
      averageTurnoverPerDay: number, // 3232423423,
      averageTurnoverPerMonth: number, // 234234234234255,
      beta: number, // 1.49
  },
  sales: DataOverTime,
  netIncome: DataOverTime
}

export interface DataOverTime {
  year: YearDatum[],
  quorter: QuoterDatum[]
}

export interface QuoterDatum extends YearDatum {
  quorterNumber: number // 2,
}

export interface YearDatum {
  year: number, // 2010,
  value: number // 10000
}
