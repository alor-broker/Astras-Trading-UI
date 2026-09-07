import {Side} from '@terminal-core-lib/common/types/side.types';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {OrderFormType, SubmitOrderParams} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {SignalAction} from '../services/ai-signals-service.types';
import {SignalRowViewModel} from '../types/ai-signals-view.types';
import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';
import {TradePlanViewHelper} from './trade-plan-view.helper';

export class SignalOrderHelper {
  static toSubmitOrderParams(signal: SignalRowViewModel | null): SubmitOrderParams | null {
    if (signal == null || signal.exchange == null || signal.exchange.trim().length === 0) {
      return null;
    }

    const details = AiSignalsViewModelHelper.toDetailsViewModel(signal);
    const plan = details?.tradePlan;
    if (details == null || plan?.entryPrice == null || plan.takeProfit1 == null || plan.stopLoss == null
      || !Number.isFinite(plan.stopLoss) || plan.stopLoss <= 0
      || TradePlanViewHelper.expectedProfitPercent(plan, details.action) == null) {
      return null;
    }

    const side = details.action === SignalAction.BuyPullback || details.action === SignalAction.BuyBreakout ? Side.Buy : Side.Sell;
    const exitSide = side === Side.Buy ? Side.Sell : Side.Buy;

    return {
      instrumentKey: InstrumentKeyHelper.toInstrumentKey({symbol: signal.ticker, exchange: signal.exchange}),
      side,
      initialValues: {
        orderType: OrderFormType.Limit,
        price: plan.entryPrice,
        quantity: 1,
        bracket: {
          topOrderPrice: side === Side.Buy ? plan.takeProfit1 : plan.stopLoss,
          topOrderSide: exitSide,
          bottomOrderPrice: side === Side.Buy ? plan.stopLoss : plan.takeProfit1,
          bottomOrderSide: exitSide
        }
      }
    };
  }
}
