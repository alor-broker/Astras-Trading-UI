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

// Status values confirmed by the /investai/signals/latest signal-2 response.
export enum SignalAnalysisStatus {
  Ok = 'ok',
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
  status?: SignalAnalysisStatus | null;
  status_note?: string | null;
  exchange?: string | null;
  broker_symbol?: string | null;
  full_ticker?: string | null;
  request_datetime?: string | null;
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

export interface SignalBatchMeta {
  n_requests?: number | null;
  n_with_consensus?: number | null;
  n_no_consensus?: number | null;
  n_degraded?: number | null;
  n_not_ready?: number | null;
  n_not_analyzed?: number | null;
  include?: {
    served_from?: string | null;
    date?: string | null;
  } | null;
  notes?: string[] | null;
}

export interface SignalBatchResult {
  schema_version?: string | null;
  generated_at?: string | null;
  decision_datetime?: string | null;
  market?: string | null;
  exchange?: string | null;
  currency?: string | null;
  capital_rub?: number | null;
  capital_amount?: number | null;
  // signal-2 also includes placeholders with status=not_analyzed for missing tickers.
  signals?: SignalForecast[] | null;
  meta?: SignalBatchMeta | null;
}

// GET /investai/instruments has its own coverage statuses, distinct from signal statuses.
export enum SignalInstrumentStatus {
  Ok = 'ok',
  NotReady = 'not_ready',
  NotAnalyzed = 'not_analyzed'
}

export interface SignalInstrument {
  ticker: string;
  exchange: string;
  broker_symbol: string;
  full_ticker: string;
  market_profile: string;
  status: SignalInstrumentStatus;
  signals_count?: number;
  consensus_count?: number;
  first_forecast_date?: string | null;
  last_forecast_date?: string | null;
  last_consensus_date?: string | null;
}

export interface SignalInstrumentsResult {
  schema_version?: string;
  generated_at?: string | null;
  exchange?: string;
  market_profile?: string;
  currency?: string;
  count?: number;
  n_ok?: number;
  instruments?: SignalInstrument[];
  notes?: string[];
}
