export enum TechnicalValueKind {
  Number = 'number',
  Percent = 'percent',
  Ratio = 'ratio',
  Text = 'text',
  Flag = 'flag'
}

export enum TechnicalGaugeKind {
  Rsi = 'rsi',
  Stochastic = 'stochastic_k',
  Adx = 'adx'
}

export interface TechnicalMetric {
  id: string;
  key: string;
  context: string[];
  value: number | string | boolean | null;
  kind: TechnicalValueKind;
}

export interface TechnicalMetricGroup {
  key: string;
  metrics: TechnicalMetric[];
}

export interface TechnicalLevel {
  key: string;
  price: number;
}

export interface TechnicalGauge {
  kind: TechnicalGaugeKind;
  value: number | null;
}

export interface TechnicalTimeframe {
  key: string;
  price: number | null;
  changePercent: number | null;
  gauges: TechnicalGauge[];
  levels: TechnicalLevel[];
  averages: TechnicalLevel[];
  summary: TechnicalMetric[];
  groups: TechnicalMetricGroup[];
  patterns: TechnicalMetricGroup[];
  detectedPatternCount: number;
  hasPatternResults: boolean;
}
