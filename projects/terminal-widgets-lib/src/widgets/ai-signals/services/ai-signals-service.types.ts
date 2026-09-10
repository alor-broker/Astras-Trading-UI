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

// Status values confirmed by the current /investai/signals/latest contract and response.
export enum SignalAnalysisStatus {
  Ok = 'ok',
  NotReady = 'not_ready',
  Expired = 'expired',
  NotAnalyzed = 'not_analyzed'
}

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
  reasoning?: string | null;
}

export interface AnalystReasoning {
  direction?: SignalDirection | null;
  action?: SignalAction | null;
  confidence?: number | null;
  expected_holding_days?: number | null;
  trade_plan?: TradePlan | null;
  risk_notes?: RiskNotes | null;
  reasoning?: string | null;
}

export interface SignalNews {
  summary?: string | null;
  period_days?: number | null;
}

export interface SignalForecast {
  ticker: string;
  status?: SignalAnalysisStatus | null;
  status_note?: string | null;
  exchange?: string | null;
  forecast_date?: string | null;
  current_price?: number | null;
  // May be absent for not_analyzed; otherwise inspect errors and warnings.
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

export interface SignalBatchResult {
  // signal-2 includes a row for every requested instrument, including placeholders.
  signals?: SignalForecast[] | null;
}

export interface SignalInstrument {
  ticker: string;
  exchange: string;
  last_forecast_date?: string | null;
}

export interface SignalInstrumentKey {
  ticker: string;
  exchange: string;
}

export interface SignalInstrumentsResult {
  instruments?: SignalInstrument[];
}
