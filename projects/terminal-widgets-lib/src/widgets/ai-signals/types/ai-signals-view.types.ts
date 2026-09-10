import {
  RiskLevel,
  SignalAction,
  SignalDirection,
  SignalForecast,
  SignalInstrumentKey
} from '../services/ai-signals-service.types';

export const aiSignalsInstrumentsRecordKey = 'instruments';

export interface InstrumentsStateRecord {
  instruments: SignalInstrumentKey[];
}

export enum SignalRowStatus {
  Ok = 'ok',
  Degraded = 'degraded',
  Error = 'error',
  Expired = 'expired',
  NotReady = 'notReady',
  NotAnalyzed = 'notAnalyzed',
  NoData = 'noData'
}

export enum ContentDisplayStatus {
  NoTickers = 'noTickers',
  Loading = 'loading',
  Error = 'error',
  Loaded = 'loaded'
}

export interface SignalOverviewViewModel {
  direction: SignalDirection | null;
  action: SignalAction | null;
  confidence: number | null;
  expectedProfitPercent: number | null;
  expectedHoldingDays: number | null;
}

export interface SignalRowViewModel extends SignalOverviewViewModel {
  ticker: string;
  exchange: string | null;
  status: SignalRowStatus;
  statusNote: string | null;
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

export interface TradePlanPriceRange {
  min: number;
  max: number;
}

export interface AnalystViewModel extends SignalSummaryViewModel {
  index: number;
}

export interface SignalSummaryViewModel extends SignalOverviewViewModel {
  currentPrice: number | null;
  reasoning: string | null;
  tradePlan: TradePlanViewModel | null;
  newsRisk: RiskLevel | null;
  gapRisk: RiskLevel | null;
  avoidReasons: string[];
}

export interface SignalDetailsViewModel extends SignalSummaryViewModel {
  ticker: string;
  status: SignalRowStatus;
  forecastDateDisplay: string | null;
  analysts: AnalystViewModel[];
  newsSummary: string | null;
  newsPeriodDays: number | null;
  fundamental: Record<string, unknown> | null;
  technicalAnalysis: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
}
