import {
  inject,
  Injectable
} from '@angular/core';
import {
  BracketCommand,
  BracketOptions
} from "./bracket-command";
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {ExecutionPolicy} from '@terminal-core-lib/features/orders/types/order-group.types';
import {take} from 'rxjs';

export interface SubmitMarketOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  orderBook: OrderbookData;
  silent: boolean;
  allowMargin?: boolean;
}

@Injectable()
export class SubmitMarketOrderCommand extends BracketCommand<SubmitMarketOrderCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly ordersDialogService = inject(OrdersDialogService);

  execute(args: SubmitMarketOrderCommandArgs): void {
    const order: NewMarketOrder = {
      instrument: InstrumentKeyHelper.toInstrumentKey(args.instrumentKey),
      side: args.side,
      quantity: args.quantity
    };

    let getProfitOrder: NewStopLimitOrder | null = null;
    let stopLossOrder: NewStopLimitOrder | null = null;

    if (this.shouldApplyBracket(args.bracketOptions, order)) {
      const basePrice = this.calculateBasePrice(order, args);
      if (basePrice != null) {
        getProfitOrder = this.prepareGetProfitOrder(
          order,
          basePrice,
          args.bracketOptions!,
          args.priceStep
        );
        stopLossOrder = this.prepareStopLossOrder(
          order,
          basePrice,
          args.bracketOptions!,
          args.priceStep
        );
      }
    }

    if (args.silent) {
      this.submitOrderSilent(
        order,
        getProfitOrder,
        stopLossOrder,
        args
      );
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: InstrumentKeyHelper.toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Market,
          quantity: order.quantity
        }
      });
    }
  }

  private submitOrderSilent(
    marketOrder: NewMarketOrder,
    getProfitOrder: NewStopLimitOrder | null,
    stopLossOrder: NewStopLimitOrder | null,
    args: SubmitMarketOrderCommandArgs
  ): void {
    marketOrder.allowMargin = args.allowMargin;

    this.orderCommandService.submitMarketOrder(marketOrder, args.targetPortfolio).pipe(
      take(1)
    ).subscribe(r => {
      if (r.isSuccess) {
        const bracketOrders = [
          getProfitOrder,
          stopLossOrder
        ].filter(o => o != null)
          .map(o => ({
            ...o,
            type: OrderType.StopLimit,
            activate: true,
            allowMargin: args.allowMargin
          } as NewLinkedOrder));

        if (bracketOrders.length > 0) {
          this.orderCommandService.submitOrdersGroup(
            bracketOrders,
            args.targetPortfolio,
            ExecutionPolicy.IgnoreCancel
          ).pipe(
            take(1)
          ).subscribe();
        }
      }
    });
  }

  private calculateBasePrice(order: NewMarketOrder, args: SubmitMarketOrderCommandArgs): number | null {
    if (order.side === Side.Buy) {
      if (args.orderBook.a.length === 0) {
        return null;
      }

      return args.orderBook.a[0].p;
    } else {
      if (args.orderBook.b.length === 0) {
        return null;
      }

      return args.orderBook.b[0].p;
    }
  }
}
