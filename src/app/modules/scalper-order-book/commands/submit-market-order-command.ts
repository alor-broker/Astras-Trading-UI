import {
  Inject,
  Injectable
} from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import {
  NewMarketOrder,
  NewStopLimitOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import {
  BracketCommand,
  BracketOptions
} from "./bracket-command";
import { OrderbookData } from "../../orderbook/models/orderbook-data.model";
import {
  forkJoin,
  Observable,
  of,
  switchMap
} from "rxjs";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

export interface SubmitMarketOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  orderBook: OrderbookData;
  silent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubmitMarketOrderCommand extends BracketCommand<SubmitMarketOrderCommandArgs> {
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

  execute(args: SubmitMarketOrderCommandArgs): void {
    const order: NewMarketOrder = {
      instrument: toInstrumentKey(args.instrumentKey),
      side: args.side,
      quantity: args.quantity,
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
        instrumentKey: toInstrumentKey(order.instrument),
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
    this.orderCommandService.submitMarketOrder(marketOrder, args.targetPortfolio).pipe(
      switchMap(r => {
        if (r.isSuccess) {
          const bracketOrders: Observable<OrderCommandResult>[] = [];

          if (getProfitOrder != null) {
            getProfitOrder.activate = true;
            bracketOrders.push(this.orderCommandService.submitStopLimitOrder(getProfitOrder, args.targetPortfolio));
          }

          if (stopLossOrder != null) {
            stopLossOrder.activate = true;
            bracketOrders.push(this.orderCommandService.submitStopLimitOrder(stopLossOrder, args.targetPortfolio));
          }

          if (bracketOrders.length > 0) {
            return forkJoin(bracketOrders);
          }
        }

        return of([]);
      })
    ).subscribe();
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
