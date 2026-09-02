export enum SignalDirection {
  Bullish = 'BULLISH',
  Bearish = 'BEARISH',
  Neutral = 'NEUTRAL'
}

export enum SignalAction {
  BuyPullback = 'BUY_PULLBACK',
  BuyBreakout = 'BUY_BREAKOUT',
  SellRally = 'SELL_RALLY',
  SellBreakdown = 'SELL_BREAKDOWN',
  NoTrade = 'NO_TRADE'
}

export enum RiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH'
}

// Checklist keys known from the endpoint contract; the server may add new ones at any time.
// Each key here must have a label in the `checklist` section of i18n/ai-signals/details/{ru,en,hy}.json;
// unknown keys are rendered as is.
export const knownShortChecklistKeys = [
  'F1_daily_bearish_regime',
  'F2_structure_supports_downside_and_entry_not_bottom_fishing',
  'F3_not_oversold_at_entry',
  'F4_rr_at_least_2'
];

// API serializes with exclude_none, so every optional field may be absent
export interface TradePlan {
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit_1?: number | null;
  take_profit_2?: number | null;
  risk_reward_ratio?: number | null;
}

export interface RiskNotes {
  news_risk?: RiskLevel | null;
  gap_risk?: RiskLevel | null;
  avoid_reasons?: string[] | null;
}

export interface ConsensusForecast {
  direction?: SignalDirection | null;
  action?: SignalAction | null;
  confidence?: number | null;
  expected_holding_days?: number | null;
  trade_plan?: TradePlan | null;
  risk_notes?: RiskNotes | null;
  short_checklist?: Record<string, boolean> | null;
  reasoning?: string | null;
  consensus_type?: string | null;
  consensus_confidence?: number | null;
  models_used?: string | null;
}

export interface AnalystReasoning {
  model_name?: string | null;
  direction?: SignalDirection | null;
  action?: SignalAction | null;
  confidence?: number | null;
  expected_holding_days?: number | null;
  trade_plan?: TradePlan | null;
  risk_notes?: RiskNotes | null;
  short_checklist?: Record<string, boolean> | null;
  reasoning?: string | null;
}

export interface SignalNews {
  summary?: string | null;
  period_days?: number | null;
  request_datetime?: string | null;
}

export interface SignalForecast {
  ticker: string;
  full_ticker?: string | null;
  request_datetime?: string | null;
  forecast_date?: string | null;
  current_price?: number | null;
  // null/absent means signal generation failed, see errors
  consensus?: ConsensusForecast | null;
  analysts?: AnalystReasoning[] | null;
  // structure is not guaranteed by the contract
  technical_analysis?: Record<string, unknown> | null;
  news?: SignalNews | null;
  // structure is not guaranteed by the contract; may be {available: false}
  fundamental?: Record<string, unknown> | null;
  errors?: string[] | null;
  warnings?: string[] | null;
}

export interface SignalBatchMeta {
  n_requests?: number | null;
  n_with_consensus?: number | null;
  n_no_consensus?: number | null;
  n_degraded?: number | null;
  notes?: string[] | null;
}

export interface SignalBatchResult {
  schema_version?: string | null;
  generated_at?: string | null;
  decision_datetime?: string | null;
  market?: string | null;
  // contains only tickers found on the server side
  signals?: SignalForecast[] | null;
  meta?: SignalBatchMeta | null;
}
