import {TechnicalGaugeKind, TechnicalValueKind} from '../types/technical-analysis-view.types';
import {TechnicalAnalysisViewModelHelper} from './technical-analysis-view-model.helper';

describe('TechnicalAnalysisViewModelHelper', () => {
  it('should hide empty and unavailable analysis and invalid timeframes', () => {
    for (const data of [null, {}, {available: false, basic_data: {price: 100}}, {daily: [], hourly: null}]) {
      expect(TechnicalAnalysisViewModelHelper.toTimeframes(data)).toEqual([]);
    }
    expect(TechnicalAnalysisViewModelHelper.toTimeframes({daily: {available: false, basic_data: {price: 100}}})).toEqual([]);
  });

  it('should support both a single snapshot and a timeframe dictionary', () => {
    const snapshot = {basic_data: {price: 100, price_change_percent: 0}};
    const single = TechnicalAnalysisViewModelHelper.toTimeframes(snapshot);
    const multiple = TechnicalAnalysisViewModelHelper.toTimeframes({'1D': snapshot, '1H': snapshot});

    expect(single[0]).toMatchObject({key: 'snapshot', price: 100, changePercent: 0});
    expect(multiple.map(timeframe => timeframe.key)).toEqual(['1D', '1H']);
  });

  it('should preserve zero gauge values without inventing missing values', () => {
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({
      oscillators: {rsi: 0, stochastic_k: NaN}, trend_indicators: {adx: Infinity}
    });

    expect(view.gauges).toEqual([
      {kind: TechnicalGaugeKind.Rsi, value: 0},
      {kind: TechnicalGaugeKind.Stochastic, value: null},
      {kind: TechnicalGaugeKind.Adx, value: null}
    ]);
  });

  it('should reject nonpositive and nonnumeric prices', () => {
    for (const price of [0, -1, Infinity, NaN, '100', null]) {
      const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({basic_data: {price}});

      expect(view.price).toBeNull();
    }
  });

  it('should convert fractional percentages exactly once and keep ratios distinct', () => {
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({volatility: {
      historical_volatility_annualized: 0.25, atr_percent: 2, volume_ratio: 1.5, log_return_mean: Number.MAX_VALUE
    }});

    expect(view.groups[0].metrics).toEqual([
      expect.objectContaining({key: 'historical_volatility_annualized', value: 25, kind: TechnicalValueKind.Percent}),
      expect.objectContaining({key: 'atr_percent', value: 2, kind: TechnicalValueKind.Percent}),
      expect.objectContaining({key: 'volume_ratio', value: 1.5, kind: TechnicalValueKind.Ratio}),
      expect.objectContaining({key: 'log_return_mean', value: null, kind: TechnicalValueKind.Percent})
    ]);
  });

  it('should retain inactive patterns but count only detected flags', () => {
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({
      candlestick_patterns: {hammer: true, doji: false},
      trend_indicators: {above_sma_20: true, adx: 30}
    });

    expect(view.detectedPatternCount).toBe(2);
    expect(view.hasPatternResults).toBe(true);
    expect(view.patterns[0].metrics.map(metric => metric.value)).toEqual([true, false]);
    expect(view.groups[0].metrics.map(metric => metric.key)).toEqual(['adx']);
  });

  it('should sort valid price levels and preserve the response', () => {
    const data = {support_resistance: {
      pivots_daily: {support_1: 90, pivot_point: 100, resistance_1: 110, support_2: -1},
      local_resistance: 105, local_support: null
    }};
    const original = structuredClone(data);
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes(data);

    expect(view.levels.map(level => level.price)).toEqual([110, 105, 100, 90]);
    expect(data).toEqual(original);
  });

  it('should keep pattern descriptions and numeric values in the indicators table', () => {
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({chart_patterns: {
      double_top: true, target: 120, description: 'Pattern explanation'
    }});

    expect(view.patterns[0].metrics.map(metric => metric.key)).toEqual(['double_top']);
    expect(view.groups[0].metrics.map(metric => [metric.key, metric.value])).toEqual([
      ['target', 120], ['description', 'Pattern explanation']
    ]);
  });

  it('should retain unknown fields with nested context and unique paths', () => {
    const [view] = TechnicalAnalysisViewModelHelper.toTimeframes({daily: {
      custom: {first: {value: 0}, second: {value: ' pending '}}
    }});

    expect(view.groups[0].metrics).toEqual([
      {id: 'first.value', key: 'value', context: ['first'], value: 0, kind: TechnicalValueKind.Number},
      {id: 'second.value', key: 'value', context: ['second'], value: 'pending', kind: TechnicalValueKind.Text}
    ]);
  });

  it('should distinguish unavailable pattern results from negative results', () => {
    const [unavailable] = TechnicalAnalysisViewModelHelper.toTimeframes({chart_patterns: {double_top: null}});
    const [negative] = TechnicalAnalysisViewModelHelper.toTimeframes({chart_patterns: {double_top: false}});

    expect(unavailable.hasPatternResults).toBe(false);
    expect(negative.hasPatternResults).toBe(true);
    expect(negative.detectedPatternCount).toBe(0);
  });
});
