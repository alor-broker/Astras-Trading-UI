import {SignalOverviewViewModel, SignalSummaryViewModel} from '../types/ai-signals-view.types';

export class SignalSummaryViewHelper {
  static hasOverview(details: SignalOverviewViewModel): boolean {
    // The holding period is only displayed alongside a known expected profit.
    return details.direction != null
      || details.action != null
      || details.confidence != null
      || details.expectedProfitPercent != null;
  }

  static hasRiskInfo(details: SignalSummaryViewModel): boolean {
    return details.newsRisk != null || details.gapRisk != null || details.avoidReasons.length > 0;
  }

  static hasSummary(details: SignalSummaryViewModel | null): boolean {
    return details != null && (
      this.hasOverview(details)
      || details.reasoning != null
      || details.tradePlan != null
      || this.hasRiskInfo(details)
    );
  }
}
