import {
  FundamentalGroup,
  FundamentalMetric,
  FundamentalMetricLabel,
  FundamentalTrendPoint,
  FundamentalTrendViewModel,
  FundamentalViewModel
} from '../types/fundamental-view.types';

// The fundamental block remains an open API dictionary. Normalize only the
// reporting fields supplied by signal-2; unknown metric names remain visible.
export class FundamentalViewModelHelper {
  private static readonly metricGroups: Record<FundamentalGroup, readonly FundamentalMetric[]> = {
    [FundamentalGroup.Income]: [
      FundamentalMetric.Revenue, FundamentalMetric.GrossProfit, FundamentalMetric.OperatingIncome,
      FundamentalMetric.Ebitda, FundamentalMetric.NetIncome, FundamentalMetric.NetIncomeOwner
    ],
    [FundamentalGroup.Balance]: [
      FundamentalMetric.TotalAssets, FundamentalMetric.TotalEquity, FundamentalMetric.NetDebt,
      FundamentalMetric.TotalDebt, FundamentalMetric.CashEquivalents
    ],
    [FundamentalGroup.Cashflow]: [
      FundamentalMetric.OperatingCashflow, FundamentalMetric.Capex, FundamentalMetric.FinancialCashflow,
      FundamentalMetric.Dividend, FundamentalMetric.Buyback
    ],
    [FundamentalGroup.Banking]: [
      FundamentalMetric.FinRevenue, FundamentalMetric.FinPercentIncomeNet,
      FundamentalMetric.FinCommissionIncomeNet, FundamentalMetric.FinReserveForCreditLoss,
      FundamentalMetric.FinIncomeNet, FundamentalMetric.FinPortfolioCredit, FundamentalMetric.FinDeposits
    ],
    [FundamentalGroup.Other]: []
  };

  private static readonly knownMetrics = new Set<string>(Object.values(FundamentalMetric));

  static toViewModel(data: Record<string, unknown> | null): FundamentalViewModel | null {
    if (data == null || data['available'] === false) {
      return null;
    }

    const asOf = this.toRecord(data['as_of']);
    const latest = this.toRecord(data['latest']);
    const groups = Object.values(FundamentalGroup).map(group => {
      const keys = group === FundamentalGroup.Other
        ? Object.keys(latest).filter(key => !this.knownMetrics.has(key))
        : this.metricGroups[group];

      return {
        key: group,
        rows: keys.flatMap(key => {
          if (!Object.hasOwn(latest, key)) {
            return [];
          }

          const item = this.toRecord(latest[key]);
          const value = this.toNumber(item['value_mln']);
          const yoy = this.toNumber(item['yoy']);

          return [{
            ...this.toMetricLabel(key),
            value,
            // yoy is a ratio, not a percentage. Never replace missing values with zero.
            yoyPercent: yoy != null && Number.isFinite(yoy * 100) ? yoy * 100 : null
          }];
        })
      };
    }).filter(group => group.rows.length > 0);

    const trends = this.toTrends(data['trend']);
    const valuation = this.toRecord(data['valuation']);
    const evEbitda = this.toNumber(valuation['ev_ebitda']);
    const dividend = this.toRecord(data['dividend']);
    const dividendValue = this.toNumber(dividend['reported_mln']);
    const notes = this.toStrings(data['notes']);
    const absent = this.toStrings(data['absent'])
      .filter(key => !Object.hasOwn(latest, key))
      .map(key => this.toMetricLabel(key));
    const statement = this.toString(asOf['statement']);

    if (groups.length === 0 && trends.length === 0 && evEbitda == null
      && dividendValue == null && notes.length === 0 && absent.length === 0) {
      return null;
    }

    return {
      currency: this.toString(data['currency']),
      reportPeriod: this.toString(asOf['report_period'])?.toUpperCase() ?? null,
      disclosed: this.toDate(asOf['disclosed']),
      statement,
      statementLabelKey: statement === 'MSFO' || statement === 'RSBU' ? `statements.${statement}` : null,
      decisionDate: this.toDate(data['decision_date']),
      isBank: data['is_bank'] === true,
      groups,
      trends,
      valuation: evEbitda == null ? null : {evEbitda, asOf: this.toDate(valuation['as_of_date'])},
      dividend: dividendValue == null
? null
: {
        value: dividendValue,
        period: this.toString(dividend['period'])?.toUpperCase() ?? null
      },
      absent,
      notes
    };
  }

  private static toTrends(value: unknown): FundamentalTrendViewModel[] {
    const trends = Object.entries(this.toRecord(value)).flatMap(([key, series]) => {
      if (!Array.isArray(series)) {
        return [];
      }

      const byPeriod = new Map<string, FundamentalTrendPoint>();
      for (const rawPoint of series) {
        const point = this.toRecord(rawPoint);
        const period = this.toString(point['period'])?.toUpperCase();
        if (period != null) {
          byPeriod.set(period, {period, value: this.toNumber(point['value_mln'])});
        }
      }

      const points = [...byPeriod.values()];
      if (points.every(point => this.periodOrder(point.period) != null)) {
        points.sort((a, b) => (this.periodOrder(a.period) ?? 0) - (this.periodOrder(b.period) ?? 0));
      }

      return points.some(point => point.value != null)
        ? [{...this.toMetricLabel(key), points}]
        : [];
    });

    // Banks may expose the same net income as both NetIncome and FinIncomeNet.
    // Suppress only an exact alias duplicate, never unrelated equal-valued metrics.
    const netIncome = trends.find(trend => trend.key === String(FundamentalMetric.NetIncome));
    return trends.filter(trend => trend.key !== String(FundamentalMetric.FinIncomeNet)
      || netIncome == null || !this.samePoints(trend.points, netIncome.points));
  }

  private static samePoints(left: FundamentalTrendPoint[], right: FundamentalTrendPoint[]): boolean {
    return left.length === right.length && left.every((point, index) =>
      point.period === right[index].period && point.value === right[index].value);
  }

  private static periodOrder(period: string): number | null {
    const match = /^(\d{4})\s+Q([1-4])$/.exec(period);
    return match == null ? null : Number(match[1]) * 4 + Number(match[2]);
  }

  private static toMetricLabel(key: string): FundamentalMetricLabel {
    return {key, labelKey: this.knownMetrics.has(key) ? `metrics.${key}` : null};
  }

  private static toRecord(value: unknown): Record<string, unknown> {
    return value != null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  }

  private static toNumber(value: unknown): number | null {
    if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private static toString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private static toStrings(value: unknown): string[] {
    return Array.isArray(value)
      ? [...new Set(value.map(item => this.toString(item)).filter((item): item is string => item != null))]
      : [];
  }

  private static toDate(value: unknown): string | null {
    const text = this.toString(value);
    if (text == null || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return null;
    }

    const date = new Date(text);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
  }
}
