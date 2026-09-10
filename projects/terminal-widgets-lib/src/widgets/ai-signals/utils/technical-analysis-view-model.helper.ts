import {
  TechnicalGauge,
  TechnicalGaugeKind,
  TechnicalLevel,
  TechnicalMetric,
  TechnicalMetricGroup,
  TechnicalTimeframe,
  TechnicalValueKind
} from '../types/technical-analysis-view.types';

export class TechnicalAnalysisViewModelHelper {
  private static readonly snapshotGroups = new Set([
    'basic_data', 'trend_indicators', 'oscillators', 'volatility', 'volume_indicators',
    'support_resistance', 'price_action', 'candlestick_patterns', 'chart_patterns',
    'divergences', 'statistics', 'advanced_indicators', 'intraday_patterns', 'summary_signals'
  ]);

  private static readonly patternGroups = new Set([
    'price_action', 'candlestick_patterns', 'chart_patterns', 'divergences'
  ]);

  private static readonly fractionalPercentFields = new Set([
    'historical_volatility_annualized', 'bb_percent_b', 'log_return_mean', 'log_return_std'
  ]);

  static toTimeframes(data: Record<string, unknown> | null): TechnicalTimeframe[] {
    if (data == null || data['available'] === false) {
      return [];
    }

    // Also support a single snapshot without an outer timeframe dictionary.
    const entries = Object.keys(data).some(key => this.snapshotGroups.has(key))
      ? [['snapshot', data] as const]
      : Object.entries(data);

    return entries.flatMap(([key, raw]) => {
      const snapshot = this.record(raw);
      if (snapshot == null || snapshot['available'] === false) {
        return [];
      }

      const groups = Object.entries(snapshot).filter(([groupKey]) => groupKey !== 'available').map(([groupKey, value]) => ({
        key: groupKey,
        metrics: this.flatten(value, groupKey)
      })).filter(group => group.metrics.length > 0);

      if (groups.length === 0) {
        return [];
      }

      const basic = this.record(snapshot['basic_data']);
      const trend = this.record(snapshot['trend_indicators']);
      const oscillators = this.record(snapshot['oscillators']);
      const supportResistance = this.record(snapshot['support_resistance']);
      const pivots = this.record(supportResistance?.['pivots_daily']);
      const volume = this.record(snapshot['volume_indicators']);
      const patterns: TechnicalMetricGroup[] = [];
      const indicators: TechnicalMetricGroup[] = [];

      for (const group of groups) {
        const flags = group.metrics.filter(metric => metric.kind === TechnicalValueKind.Flag);
        const isPatternGroup = this.patternGroups.has(group.key);
        const patternMetrics = isPatternGroup
          ? group.metrics.filter(metric => metric.kind === TechnicalValueKind.Flag || metric.value == null)
          : flags;
        if (patternMetrics.length > 0) {
          patterns.push({key: group.key, metrics: patternMetrics});
        }

        const metrics = group.metrics.filter(metric => metric.kind !== TechnicalValueKind.Flag
          && (!isPatternGroup || metric.value != null));
        if (metrics.length > 0) {
          indicators.push({key: group.key, metrics});
        }
      }

      const gauges: TechnicalGauge[] = [
        {kind: TechnicalGaugeKind.Rsi, value: this.number(oscillators?.['rsi'])},
        {kind: TechnicalGaugeKind.Stochastic, value: this.number(oscillators?.['stochastic_k'])},
        {kind: TechnicalGaugeKind.Adx, value: this.number(trend?.['adx'])}
      ];

      return [{
        key,
        price: this.positiveNumber(basic?.['price']),
        changePercent: this.number(basic?.['price_change_percent']),
        gauges: gauges.filter(gauge => gauge.kind === TechnicalGaugeKind.Adx ? trend != null : oscillators != null),
        levels: [
          ...this.levels(pivots, ['resistance_3', 'resistance_2', 'resistance_1', 'pivot_point', 'support_1', 'support_2', 'support_3']),
          ...this.levels(supportResistance, ['local_resistance', 'local_support'])
        ].sort((a, b) => b.price - a.price),
        averages: [
          ...this.levels(trend, ['sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26']),
          ...this.levels(volume, ['vwap'])
        ],
        summary: groups.find(group => group.key === 'summary_signals')?.metrics.filter(metric => metric.context.length === 0) ?? [],
        groups: indicators,
        patterns,
        detectedPatternCount: patterns.reduce((count, group) => count + group.metrics.filter(metric => metric.value === true).length, 0),
        hasPatternResults: patterns.some(group => group.metrics.some(metric => typeof metric.value === 'boolean'))
      }];
    });
  }

  private static record(value: unknown): Record<string, unknown> | null {
    return value != null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
: null;
  }

  private static number(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private static positiveNumber(value: unknown): number | null {
    const result = this.number(value);
    return result != null && result > 0 ? result : null;
  }

  private static levels(data: Record<string, unknown> | null, keys: string[]): TechnicalLevel[] {
    return keys.flatMap(key => {
      const price = this.positiveNumber(data?.[key]);
      return price == null ? [] : [{key, price}];
    });
  }

  private static flatten(value: unknown, key: string, context: string[] = [], depth = 0): TechnicalMetric[] {
    if (depth > 8) {
      return [];
    }

    const record = this.record(value);
    if (record != null || Array.isArray(value)) {
      return Object.entries(value as Record<string, unknown>).flatMap(([childKey, childValue]) =>
        this.flatten(childValue, childKey, depth === 0 ? [] : [...context, key], depth + 1)
      );
    }

    let normalized: TechnicalMetric['value'] = null;
    let kind = TechnicalValueKind.Text;
    if (typeof value === 'number') {
      normalized = this.number(value);
      kind = TechnicalValueKind.Number;
      if (this.fractionalPercentFields.has(key)) {
        normalized = normalized == null ? null : this.number(normalized * 100);
        kind = TechnicalValueKind.Percent;
      } else if (key.endsWith('_percent') || key === 'roc') {
        kind = TechnicalValueKind.Percent;
      } else if (key === 'volume_ratio') {
        kind = TechnicalValueKind.Ratio;
      }
    } else if (typeof value === 'boolean') {
      normalized = value;
      kind = TechnicalValueKind.Flag;
    } else if (typeof value === 'string' && value.trim().length > 0) {
      normalized = value.trim();
    }

    return [{id: [...context, key].join('.'), key, context, value: normalized, kind}];
  }
}
