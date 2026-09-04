import {SignalAction} from '../services/ai-signals-service.types';
import {TradePlanViewModel} from '../types/ai-signals-view.types';
import {TradePlanLevel} from '../types/trade-plan-level.types';
import {TradePlanViewHelper} from './trade-plan-view.helper';

function createPlan(overrides: Partial<TradePlanViewModel> = {}): TradePlanViewModel {
  return {entryPrice: 100, stopLoss: 90, takeProfit1: 110, takeProfit2: 120, riskRewardRatio: 1, ...overrides};
}

describe('TradePlanViewHelper', () => {
  describe('expectedProfitPercent', () => {
    it.each([SignalAction.BuyPullback, SignalAction.BuyBreakout])('should calculate long reward for %s', action => {
      expect(TradePlanViewHelper.expectedProfitPercent(createPlan(), action)).toBe(10);
    });

    it.each([SignalAction.SellRally, SignalAction.SellBreakdown])('should calculate short reward for %s', action => {
      const plan = createPlan({stopLoss: 110, takeProfit1: 90, takeProfit2: 80});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, action)).toBe(10);
    });

    it.each([null, SignalAction.NoTrade])('should not infer a trade side for %s', action => {
      expect(TradePlanViewHelper.expectedProfitPercent(createPlan(), action)).toBeNull();
    });

    it('should not turn a losing long target into positive profit', () => {
      const plan = createPlan({takeProfit1: 95});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, SignalAction.BuyPullback)).toBeNull();
    });

    it('should not turn a losing short target into positive profit', () => {
      const plan = createPlan({stopLoss: 120});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, SignalAction.SellRally)).toBeNull();
    });

    it.each([100, 105])('should reject a long stop at or above entry (%s)', stopLoss => {
      expect(TradePlanViewHelper.expectedProfitPercent(createPlan({stopLoss}), SignalAction.BuyPullback)).toBeNull();
    });

    it('should reject a short stop below entry', () => {
      const plan = createPlan({takeProfit1: 95, takeProfit2: 90});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, SignalAction.SellRally)).toBeNull();
    });

    it('should reject an optimistic target closer than the conservative target', () => {
      const plan = createPlan({takeProfit2: 105});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, SignalAction.BuyPullback)).toBeNull();
    });

    it('should accept missing optional levels without substituting zero', () => {
      const plan = createPlan({stopLoss: null, takeProfit2: null});

      expect(TradePlanViewHelper.expectedProfitPercent(plan, SignalAction.BuyPullback)).toBe(10);
    });

    it.each([null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('should reject an invalid entry (%s)', entryPrice => {
      expect(TradePlanViewHelper.expectedProfitPercent(createPlan({entryPrice}), SignalAction.BuyPullback)).toBeNull();
    });

    it('should return no reward for a missing plan or target', () => {
      expect(TradePlanViewHelper.expectedProfitPercent(null, SignalAction.BuyPullback)).toBeNull();
      expect(TradePlanViewHelper.expectedProfitPercent(createPlan({takeProfit1: null}), SignalAction.BuyPullback)).toBeNull();
    });
  });

  describe('priceRange', () => {
    it('should keep the real extrema of multiple prices', () => {
      expect(TradePlanViewHelper.priceRange([110, 90, 100])).toEqual({min: 90, max: 110});
    });

    it.each([[100], [100, 100]])('should give equal prices a visible scale (%j)', (...prices) => {
      expect(TradePlanViewHelper.priceRange(prices)).toEqual({min: 99, max: 101});
    });

    it('should discard invalid prices and report an empty scale', () => {
      expect(TradePlanViewHelper.priceRange([0, -1, Number.NaN, Number.POSITIVE_INFINITY])).toBeNull();
      expect(TradePlanViewHelper.priceRange([])).toBeNull();
    });

    it.each([Number.MIN_VALUE, Number.MAX_VALUE])('should keep a single extreme price inside finite bounds (%s)', price => {
      const range = TradePlanViewHelper.priceRange([price]);

      expect(range).not.toBeNull();
      expect(range!.min).toBeGreaterThan(0);
      expect(range!.max).toBeGreaterThan(range!.min);
      expect(Number.isFinite(range!.max)).toBe(true);
      expect(range!.min).toBeLessThanOrEqual(price);
      expect(range!.max).toBeGreaterThanOrEqual(price);
    });
  });

  describe('prices and levels', () => {
    it('should not include the dimensionless reward/risk ratio in prices', () => {
      expect(TradePlanViewHelper.prices(createPlan({riskRewardRatio: 1000}))).toEqual([100, 90, 110, 120]);
    });

    it('should preserve missing levels and the current price as separate entries', () => {
      const levels = TradePlanViewHelper.levels(createPlan({entryPrice: null, takeProfit2: Number.NaN}), 101);

      expect(levels.find(level => level.labelKey === TradePlanLevel.EntryPrice)?.value).toBeNull();
      expect(levels.find(level => level.labelKey === TradePlanLevel.TakeProfit2)?.value).toBeNull();
      expect(levels.find(level => level.labelKey === TradePlanLevel.CurrentPrice)?.value).toBe(101);
      expect(levels.find(level => level.labelKey === TradePlanLevel.TakeProfit1)?.tooltipKey).toBe('takeProfit1Tooltip');
    });
  });
});
