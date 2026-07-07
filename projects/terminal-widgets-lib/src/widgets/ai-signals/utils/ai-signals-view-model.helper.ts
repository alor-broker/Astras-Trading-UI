import {
  knownShortChecklistKeys,
  RiskLevel,
  SignalAction,
  SignalBatchResult,
  SignalDirection,
  SignalForecast
} from '../services/ai-signals-service.types';
import {
  aiSignalsDefaultExchange,
  AnalystViewModel,
  ChecklistItemViewModel,
  SignalDetailsViewModel,
  SignalRowStatus,
  SignalRowViewModel,
  TradePlanViewModel
} from '../types/ai-signals-view.types';

export class AiSignalsViewModelHelper {
  static normalizeTicker(value: string): string {
    return value.trim().toUpperCase();
  }

  static toRowViewModels(requestedTickers: string[], response: SignalBatchResult): SignalRowViewModel[] {
    const signals = response.signals ?? [];

    return requestedTickers
      .map(ticker => this.normalizeTicker(ticker))
      .filter(ticker => ticker.length > 0)
      .map(ticker => this.toRowViewModel(ticker, signals));
  }

  static toDetailsViewModel(row: SignalRowViewModel): SignalDetailsViewModel | null {
    const signal = row.raw;
    if (signal == null) {
      return null;
    }

    const consensus = signal.consensus ?? null;

    return {
      ticker: row.ticker,
      status: row.status,
      direction: row.direction,
      action: row.action,
      confidence: row.confidence,
      currentPrice: row.currentPrice,
      forecastDateDisplay: row.forecastDateDisplay,
      expectedHoldingDays: consensus?.expected_holding_days ?? null,
      reasoning: this.toNonEmptyString(consensus?.reasoning),
      tradePlan: row.action === SignalAction.NoTrade
        ? null
        : this.toTradePlanViewModel(signal),
      checklist: this.toChecklistItems(consensus?.short_checklist),
      newsRisk: this.toEnumValue(consensus?.risk_notes?.news_risk, RiskLevel),
      gapRisk: this.toEnumValue(consensus?.risk_notes?.gap_risk, RiskLevel),
      avoidReasons: consensus?.risk_notes?.avoid_reasons ?? [],
      analysts: (signal.analysts ?? []).map((analyst, index) => this.toAnalystViewModel(analyst, index + 1)),
      newsSummary: this.toNonEmptyString(signal.news?.summary),
      newsPeriodDays: signal.news?.period_days ?? null,
      fundamental: this.toFundamentalDisplayData(signal.fundamental),
      technicalAnalysis: this.toTechnicalAnalysisDisplayData(signal.technical_analysis),
      errors: signal.errors ?? [],
      warnings: signal.warnings ?? []
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
    const signal = signals.find(s => s.ticker.toUpperCase() === requestedTicker) ?? null;

    if (signal == null) {
      return {
        ticker: requestedTicker,
        exchange: aiSignalsDefaultExchange,
        status: SignalRowStatus.NoData,
        direction: null,
        action: null,
        confidence: null,
        currentPrice: null,
        forecastDateDisplay: null,
        raw: null
      };
    }

    const consensus = signal.consensus ?? null;
    const warnings = signal.warnings ?? [];
    const errors = signal.errors ?? [];

    let status = SignalRowStatus.Ok;
    if (consensus == null) {
      status = SignalRowStatus.Error;
    } else if (warnings.length > 0 || errors.length > 0) {
      status = SignalRowStatus.Degraded;
    }

    return {
      ticker: requestedTicker,
      exchange: this.toExchange(signal),
      status,
      direction: this.toEnumValue(consensus?.direction, SignalDirection),
      action: this.toEnumValue(consensus?.action, SignalAction),
      confidence: consensus?.confidence ?? null,
      currentPrice: signal.current_price ?? null,
      forecastDateDisplay: this.formatForecastDate(signal.forecast_date),
      raw: signal
    };
  }

  private static toExchange(signal: SignalForecast): string {
    // full_ticker has the "SBER:MOEX" format
    const exchange = signal.full_ticker?.split(':')[1]?.trim() ?? '';

    return exchange.length > 0
      ? exchange.toUpperCase()
      : aiSignalsDefaultExchange;
  }

  private static toTradePlanViewModel(signal: SignalForecast): TradePlanViewModel | null {
    const tradePlan = signal.consensus?.trade_plan;
    if (tradePlan == null) {
      return null;
    }

    return {
      entryPrice: tradePlan.entry_price ?? null,
      stopLoss: tradePlan.stop_loss ?? null,
      takeProfit1: tradePlan.take_profit_1 ?? null,
      takeProfit2: tradePlan.take_profit_2 ?? null,
      riskRewardRatio: tradePlan.risk_reward_ratio ?? null
    };
  }

  private static toChecklistItems(checklist: Record<string, boolean> | null | undefined): ChecklistItemViewModel[] {
    if (checklist == null) {
      return [];
    }

    return Object.entries(checklist)
      .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      .map(([key, passed]) => ({
        key,
        labelKey: knownShortChecklistKeys.includes(key) ? key : null,
        passed
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  // the API model name is intentionally dropped here; analysts are shown to the user only by their ordinal
  private static toAnalystViewModel(analyst: {
    direction?: SignalDirection | null;
    action?: SignalAction | null;
    confidence?: number | null;
    reasoning?: string | null;
  }, index: number): AnalystViewModel {
    return {
      index,
      direction: this.toEnumValue(analyst.direction, SignalDirection),
      action: this.toEnumValue(analyst.action, SignalAction),
      confidence: analyst.confidence ?? null,
      reasoning: this.toNonEmptyString(analyst.reasoning)
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
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0
      ? trimmed
      : null;
  }
}
