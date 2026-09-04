import {RiskLevel, SignalAction} from '../services/ai-signals-service.types';
import {SignalSummaryViewModel} from '../types/ai-signals-view.types';
import {SignalSummaryViewHelper} from './signal-summary-view.helper';

describe('SignalSummaryViewHelper', () => {
  const empty: SignalSummaryViewModel = {
    direction: null,
    action: null,
    confidence: null,
    expectedProfitPercent: null,
    expectedHoldingDays: null,
    currentPrice: null,
    reasoning: null,
    tradePlan: null,
    newsRisk: null,
    gapRisk: null,
    avoidReasons: []
  };

  it('should hide missing summaries and empty overviews', () => {
    expect(SignalSummaryViewHelper.hasSummary(null)).toBe(false);
    expect(SignalSummaryViewHelper.hasSummary(empty)).toBe(false);
    expect(SignalSummaryViewHelper.hasOverview(empty)).toBe(false);
  });

  it('should not render a panel for a holding period without known profit', () => {
    const details = {...empty, expectedHoldingDays: 1, currentPrice: 100};

    expect(SignalSummaryViewHelper.hasSummary(details)).toBe(false);
    expect(SignalSummaryViewHelper.hasOverview(details)).toBe(false);
    expect(SignalSummaryViewHelper.hasOverview({...details, expectedProfitPercent: 2})).toBe(true);
  });

  it('should keep zero confidence and no-trade recommendations visible', () => {
    expect(SignalSummaryViewHelper.hasOverview({...empty, confidence: 0})).toBe(true);
    expect(SignalSummaryViewHelper.hasOverview({...empty, action: SignalAction.NoTrade})).toBe(true);
  });

  it('should show risk-only summaries without an empty overview', () => {
    for (const risk of [{newsRisk: RiskLevel.High}, {gapRisk: RiskLevel.Low}, {avoidReasons: ['News event']}]) {
      const details = {...empty, ...risk};

      expect(SignalSummaryViewHelper.hasSummary(details)).toBe(true);
      expect(SignalSummaryViewHelper.hasRiskInfo(details)).toBe(true);
      expect(SignalSummaryViewHelper.hasOverview(details)).toBe(false);
    }
  });

  it('should show reasoning and trade plans independently of the overview', () => {
    expect(SignalSummaryViewHelper.hasSummary({...empty, reasoning: 'Analysis'})).toBe(true);
    expect(SignalSummaryViewHelper.hasSummary({
      ...empty,
      tradePlan: {entryPrice: 100, stopLoss: null, takeProfit1: null, takeProfit2: null, riskRewardRatio: null}
    })).toBe(true);
  });
});
