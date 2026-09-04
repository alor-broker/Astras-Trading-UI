import {
  AnalystReasoning,
  RiskLevel,
  SignalAction,
  SignalAnalysisStatus,
  SignalBatchResult,
  SignalDirection,
  SignalForecast,
  TradePlan
} from '../services/ai-signals-service.types';
import {
  AnalystViewModel,
  SignalDetailsViewModel,
  SignalRowStatus,
  SignalRowViewModel,
  TradePlanViewModel
} from '../types/ai-signals-view.types';

import {TradePlanViewHelper} from './trade-plan-view.helper';

export class AiSignalsViewModelHelper {
  static normalizeTicker(value: string): string {
    return value.trim().toUpperCase();
  }

  static toRowViewModels(requestedTickers: string[], response: SignalBatchResult): SignalRowViewModel[] {
    const signals = response.signals ?? [];

    return [...new Set(requestedTickers
      .map(ticker => this.normalizeTicker(ticker))
      .filter(ticker => ticker.length > 0))]
      .map(ticker => this.toRowViewModel(ticker, signals))
      .sort((left, right) => (right.confidence ?? -1) - (left.confidence ?? -1));
  }

  static toDetailsViewModel(row: SignalRowViewModel): SignalDetailsViewModel | null {
    const signal = row.raw;
    if (signal == null || !this.canOpenDetails(row)) {
      return null;
    }

    const consensus = signal.consensus ?? null;
    const tradePlan = row.action === SignalAction.NoTrade
      ? null
      : this.toTradePlanViewModel(consensus?.trade_plan);

    return {
      ticker: row.ticker,
      status: row.status,
      direction: row.direction,
      action: row.action,
      confidence: row.confidence,
      currentPrice: row.currentPrice,
      expectedProfitPercent: row.expectedProfitPercent,
      forecastDateDisplay: row.forecastDateDisplay,
      expectedHoldingDays: row.expectedHoldingDays,
      reasoning: this.toNonEmptyString(consensus?.reasoning),
      tradePlan,
      newsRisk: this.toEnumValue(consensus?.risk_notes?.news_risk, RiskLevel),
      gapRisk: this.toEnumValue(consensus?.risk_notes?.gap_risk, RiskLevel),
      avoidReasons: this.toNonEmptyStrings(consensus?.risk_notes?.avoid_reasons),
      analysts: Array.isArray(signal.analysts)
        ? signal.analysts.map((analyst, index) => this.toAnalystViewModel(analyst, index + 1, row.currentPrice))
        : [],
      newsSummary: this.toNonEmptyString(signal.news?.summary),
      newsPeriodDays: this.toPositiveInteger(signal.news?.period_days),
      fundamental: this.toFundamentalDisplayData(signal.fundamental),
      technicalAnalysis: this.toTechnicalAnalysisDisplayData(signal.technical_analysis),
      errors: this.toNonEmptyStrings(signal.errors),
      warnings: this.toNonEmptyStrings(signal.warnings)
    };
  }

  static toEnumValue<T extends string>(value: string | null | undefined, enumType: Record<string, T>): T | null {
    if (value == null) {
      return null;
    }

    return (Object.values(enumType) as string[]).includes(value)
      ? value as T
      : null;
  }

  static canOpenDetails(row: SignalRowViewModel): boolean {
    return row.raw != null && row.status !== SignalRowStatus.NotAnalyzed && row.status !== SignalRowStatus.NoData;
  }

  static formatForecastDate(forecastDate: string | null | undefined): string | null {
    if (forecastDate == null || forecastDate.length === 0) {
      return null;
    }

    // pure string formatting keeps malformed server values displayable (DatePipe throws on unparseable input)
    const parts = forecastDate.split('-');
    if (parts.length !== 3) {
      return forecastDate;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  private static toRowViewModel(requestedTicker: string, signals: SignalForecast[]): SignalRowViewModel {
    const signal = signals.find(s => (
      typeof s.ticker === 'string'
      && this.normalizeTicker(s.ticker) === requestedTicker
    )) ?? null;

    if (signal == null) {
      return {
        ticker: requestedTicker,
        exchange: null,
        status: SignalRowStatus.NoData,
        statusNote: null,
        direction: null,
        action: null,
        confidence: null,
        expectedProfitPercent: null,
        expectedHoldingDays: null,
        currentPrice: null,
        forecastDateDisplay: null,
        raw: null
      };
    }

    const isNotAnalyzed = signal.status === SignalAnalysisStatus.NotAnalyzed;
    const consensus = isNotAnalyzed ? null : signal.consensus ?? null;
    const warnings = this.toNonEmptyStrings(signal.warnings);
    const errors = this.toNonEmptyStrings(signal.errors);
    const action = this.toEnumValue(consensus?.action, SignalAction);
    const tradePlan = action === SignalAction.NoTrade ? null : this.toTradePlanViewModel(consensus?.trade_plan);

    let status = SignalRowStatus.Ok;
    if (isNotAnalyzed) {
      status = SignalRowStatus.NotAnalyzed;
    } else if (consensus == null) {
      status = SignalRowStatus.Error;
    } else if (warnings.length > 0 || errors.length > 0) {
      status = SignalRowStatus.Degraded;
    }

    return {
      ticker: requestedTicker,
      exchange: this.toNonEmptyString(signal.exchange)?.toUpperCase() ?? null,
      status,
      statusNote: this.toNonEmptyString(signal.status_note),
      direction: this.toEnumValue(consensus?.direction, SignalDirection),
      action,
      confidence: this.toConfidence(consensus?.confidence),
      expectedProfitPercent: TradePlanViewHelper.expectedProfitPercent(tradePlan, action),
      expectedHoldingDays: this.toPositiveInteger(consensus?.expected_holding_days),
      currentPrice: this.toPositiveNumber(signal.current_price),
      forecastDateDisplay: this.formatForecastDate(signal.forecast_date),
      raw: signal
    };
  }

  private static toTradePlanViewModel(tradePlan: TradePlan | null | undefined): TradePlanViewModel | null {
    if (tradePlan == null) {
      return null;
    }

    const viewModel: TradePlanViewModel = {
      entryPrice: this.toPositiveNumber(tradePlan.entry_price),
      stopLoss: this.toPositiveNumber(tradePlan.stop_loss),
      takeProfit1: this.toPositiveNumber(tradePlan.take_profit_1),
      takeProfit2: this.toPositiveNumber(tradePlan.take_profit_2),
      riskRewardRatio: this.toPositiveNumber(tradePlan.risk_reward_ratio)
    };

    return Object.values(viewModel).some(value => value != null)
      ? viewModel
      : null;
  }

  // the API model name is intentionally dropped here; analysts are shown to the user only by their ordinal
  private static toAnalystViewModel(
    analyst: AnalystReasoning | null,
    index: number,
    currentPrice: number | null
  ): AnalystViewModel {
    const action = this.toEnumValue(analyst?.action, SignalAction);
    const tradePlan = action === SignalAction.NoTrade ? null : this.toTradePlanViewModel(analyst?.trade_plan);

    return {
      index,
      direction: this.toEnumValue(analyst?.direction, SignalDirection),
      action,
      confidence: this.toConfidence(analyst?.confidence),
      currentPrice,
      expectedHoldingDays: this.toPositiveInteger(analyst?.expected_holding_days),
      expectedProfitPercent: TradePlanViewHelper.expectedProfitPercent(tradePlan, action),
      reasoning: this.toNonEmptyString(analyst?.reasoning),
      tradePlan,
      newsRisk: this.toEnumValue(analyst?.risk_notes?.news_risk, RiskLevel),
      gapRisk: this.toEnumValue(analyst?.risk_notes?.gap_risk, RiskLevel),
      avoidReasons: this.toNonEmptyStrings(analyst?.risk_notes?.avoid_reasons)
    };
  }

  private static toFundamentalDisplayData(fundamental: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
    if (fundamental == null || fundamental['available'] === false) {
      return null;
    }

    const displayData = {...fundamental};
    delete displayData['available'];

    return Object.keys(displayData).length > 0
      ? displayData
      : null;
  }

  private static toTechnicalAnalysisDisplayData(technicalAnalysis: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
    if (technicalAnalysis == null || Object.keys(technicalAnalysis).length === 0) {
      return null;
    }

    const displayData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(technicalAnalysis)) {
      displayData[this.toTimeframeDisplayKey(key)] = value;
    }

    return displayData;
  }

  private static toTimeframeDisplayKey(key: string): string {
    const match = /^tf_(\d+)$/.exec(key);
    if (match == null) {
      return key;
    }

    const seconds = Number(match[1]);
    if (seconds % 86_400 === 0) {
      return `${seconds / 86_400}D`;
    }

    if (seconds % 3_600 === 0) {
      return `${seconds / 3_600}H`;
    }

    if (seconds % 60 === 0) {
      return `${seconds / 60}M`;
    }

    return `${seconds}S`;
  }

  private static toNonEmptyString(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0
      ? trimmed
      : null;
  }

  private static toNonEmptyStrings(values: string[] | null | undefined): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map(value => typeof value === 'string' ? this.toNonEmptyString(value) : null)
      .filter((value): value is string => value != null);
  }

  private static toPositiveNumber(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : null;
  }

  private static toPositiveInteger(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : null;
  }

  private static toConfidence(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10
      ? value
      : null;
  }
}
