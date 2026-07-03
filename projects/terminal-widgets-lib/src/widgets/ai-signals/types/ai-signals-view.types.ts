import {
  RiskLevel,
  SignalAction,
  SignalDirection,
  SignalForecast
} from '../services/ai-signals-service.types';

export const maxTickersCount = 10;

export const aiSignalsTickersRecordKey = 'tickers';

// the API currently serves MOEX only; used for instrument search restriction
// and as a fallback when a signal has no full_ticker
export const aiSignalsDefaultExchange = 'MOEX';

export interface TickersStateRecord {
  tickers: string[];
}

export enum SignalRowStatus {
  Ok = 'ok',
  Degraded = 'degraded',
  Error = 'error',
  NoData = 'noData'
}

export enum ContentDisplayStatus {
  NoTickers = 'noTickers',
  Loading = 'loading',
  Error = 'error',
  Loaded = 'loaded'
}

export interface SignalRowViewModel {
  ticker: string;
  exchange: string;
  status: SignalRowStatus;
  direction: SignalDirection | null;
  action: SignalAction | null;
  confidence: number | null;
  currentPrice: number | null;
  forecastDateDisplay: string | null;
  raw: SignalForecast | null;
}

export interface TradePlanViewModel {
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  riskRewardRatio: number | null;
}

export interface ChecklistItemViewModel {
  key: string;
  // null when the key is not known from the contract; the raw key is displayed instead
  labelKey: string | null;
  passed: boolean;
}

export interface AnalystViewModel {
  modelName: string;
  direction: SignalDirection | null;
  action: SignalAction | null;
  confidence: number | null;
  reasoning: string | null;
}

export interface SignalDetailsViewModel {
  ticker: string;
  status: SignalRowStatus;
  direction: SignalDirection | null;
  action: SignalAction | null;
  confidence: number | null;
  currentPrice: number | null;
  forecastDateDisplay: string | null;
  expectedHoldingDays: number | null;
  modelsUsed: string | null;
  reasoning: string | null;
  tradePlan: TradePlanViewModel | null;
  checklist: ChecklistItemViewModel[];
  newsRisk: RiskLevel | null;
  gapRisk: RiskLevel | null;
  avoidReasons: string[];
  analysts: AnalystViewModel[];
  newsSummary: string | null;
  newsPeriodDays: number | null;
  fundamental: Record<string, unknown> | null;
  technicalAnalysis: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
}
