import {SignalAction} from '../services/ai-signals-service.types';
import {TradePlanPriceRange, TradePlanViewModel} from '../types/ai-signals-view.types';
import {TradePlanLevel, TradePlanValue} from '../types/trade-plan-level.types';

export class TradePlanViewHelper {
  static levels(plan: TradePlanViewModel, currentPrice: number | null): TradePlanValue[] {
    return Object.values(TradePlanLevel).map(labelKey => ({
      labelKey,
      tooltipKey: this.tooltipKey(labelKey),
      value: this.positiveNumber(labelKey === TradePlanLevel.CurrentPrice ? currentPrice : plan[labelKey])
    }));
  }

  static prices(plan: TradePlanViewModel | null): number[] {
    if (plan == null) {
      return [];
    }

    return this.levels(plan, null).flatMap(level => level.value == null ? [] : [level.value]);
  }

  static priceRange(values: readonly number[]): TradePlanPriceRange | null {
    const prices = values.filter(value => this.positiveNumber(value) != null);
    if (prices.length === 0) {
      return null;
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min !== max) {
      return {min, max};
    }

    // A single price still needs a non-zero scale. Bound the padding to finite, positive prices.
    const padding = Math.max(min * 0.01, Number.EPSILON);
    return {min: Math.max(Number.MIN_VALUE, min - padding), max: Math.min(Number.MAX_VALUE, max + padding)};
  }

  static expectedProfitPercent(plan: TradePlanViewModel | null, action: SignalAction | null): number | null {
    const entry = this.positiveNumber(plan?.entryPrice);
    const target = this.positiveNumber(plan?.takeProfit1);
    if (entry == null || target == null) {
      return null;
    }

    let side: number;
    switch (action) {
      case SignalAction.BuyPullback:
      case SignalAction.BuyBreakout:
        side = 1;
        break;
      case SignalAction.SellRally:
      case SignalAction.SellBreakdown:
        side = -1;
        break;
      default:
        return null;
    }

    const reward = (target - entry) * side;
    const stop = this.positiveNumber(plan?.stopLoss);
    const optimisticTarget = this.positiveNumber(plan?.takeProfit2);
    if (reward <= 0
      || (stop != null && (entry - stop) * side <= 0)
      || (optimisticTarget != null && (optimisticTarget - target) * side < 0)) {
      return null;
    }

    const result = reward / entry * 100;
    return Number.isFinite(result) ? result : null;
  }

  static tooltipKey(level: TradePlanLevel): string {
    switch (level) {
      case TradePlanLevel.TakeProfit1:
        return 'takeProfit1Tooltip';
      case TradePlanLevel.TakeProfit2:
        return 'takeProfit2Tooltip';
      default:
        return level;
    }
  }

  private static positiveNumber(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  }
}
