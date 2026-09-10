import {Side} from '@terminal-core-lib/common/types/side.types';
import {OrderFormType} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {SignalAction, SignalForecast, TradePlan} from '../services/ai-signals-service.types';
import {SignalRowViewModel} from '../types/ai-signals-view.types';
import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';
import {SignalOrderHelper} from './signal-order.helper';

describe('SignalOrderHelper', () => {
  function row(action = SignalAction.BuyPullback, plan: TradePlan | null = {
    entry_price: 100, take_profit_1: 110, take_profit_2: 120, stop_loss: 90
  }, overrides: Partial<SignalForecast> = {}): SignalRowViewModel {
    return AiSignalsViewModelHelper.toRowViewModels([{ticker: 'SBER', exchange: 'MOEX'}], {signals: [{
      ticker: 'SBER', exchange: 'MOEX', current_price: 105,
      consensus: {action, trade_plan: plan}, ...overrides
    }]})[0];
  }

  it.each([SignalAction.BuyPullback, SignalAction.BuyBreakout])('should prefill a buy limit order from %s using entry and target 1', action => {
    const params = SignalOrderHelper.toSubmitOrderParams(row(action));

    expect(params).toEqual({
      instrumentKey: {symbol: 'SBER', exchange: 'MOEX'}, side: Side.Buy,
      initialValues: {
        orderType: OrderFormType.Limit, price: 100, quantity: 1,
        bracket: {topOrderPrice: 110, bottomOrderPrice: 90, topOrderSide: Side.Sell, bottomOrderSide: Side.Sell}
      }
    });
  });

  it.each([SignalAction.SellRally, SignalAction.SellBreakdown])('should place a sell stop above and target below for %s', action => {
    const params = SignalOrderHelper.toSubmitOrderParams(row(action, {entry_price: 100, take_profit_1: 90, stop_loss: 110}));

    expect(params).toMatchObject({
      side: Side.Sell,
      initialValues: {price: 100, quantity: 1, bracket: {
        topOrderPrice: 110, bottomOrderPrice: 90, topOrderSide: Side.Buy, bottomOrderSide: Side.Buy
      }}
    });
  });

  it('should not offer trading without a signal, consensus, exchange, action or trade plan', () => {
    expect(SignalOrderHelper.toSubmitOrderParams(null)).toBeNull();
    expect(SignalOrderHelper.toSubmitOrderParams(row(SignalAction.NoTrade))).toBeNull();
    expect(SignalOrderHelper.toSubmitOrderParams(row(SignalAction.BuyPullback, null))).toBeNull();
    expect(SignalOrderHelper.toSubmitOrderParams({...row(), exchange: null})).toBeNull();
    expect(SignalOrderHelper.toSubmitOrderParams(row(SignalAction.BuyPullback, null, {consensus: null}))).toBeNull();
  });

  it.each([
    {entry_price: null, take_profit_1: 110, stop_loss: 90},
    {entry_price: 100, take_profit_1: null, stop_loss: 90},
    {entry_price: 100, take_profit_1: 110, stop_loss: null},
    {entry_price: 100, take_profit_1: 110, stop_loss: 0},
    {entry_price: 100, take_profit_1: 110, stop_loss: 105},
    {entry_price: 100, take_profit_1: 95, stop_loss: 90},
    {entry_price: 100, take_profit_1: 110, stop_loss: Number.NaN},
    {entry_price: Number.POSITIVE_INFINITY, take_profit_1: 110, stop_loss: 90}
  ])('should reject incomplete or invalid levels: %j', plan => {
    expect(SignalOrderHelper.toSubmitOrderParams(row(SignalAction.BuyPullback, plan))).toBeNull();
  });
});
