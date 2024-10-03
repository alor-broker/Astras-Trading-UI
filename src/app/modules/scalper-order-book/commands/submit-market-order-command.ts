import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import {
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder
} from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import {
  BracketCommand,
  BracketOptions
} from "./bracket-command";
import { OrdersGroupService } from "../../../shared/services/orders/orders-group.service";
import { OrderbookData } from "../../orderbook/models/orderbook-data.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import { take } from "rxjs";

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
    private readonly wsOrdersService: WsOrdersService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly ordersGroupService: OrdersGroupService
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
    if (getProfitOrder != null || stopLossOrder != null) {
      const orders: NewLinkedOrder[] = [
        {
          ...marketOrder,
          type: OrderType.Market
        }
      ];

      if (getProfitOrder != null) {
        orders.push({
          ...getProfitOrder,
          type: OrderType.StopLimit
        });
      }

      if (stopLossOrder != null) {
        orders.push({
          ...stopLossOrder,
          type: OrderType.StopLimit
        });
      }

      this.ordersGroupService.submitOrdersGroup(
        orders,
        args.targetPortfolio,
        ExecutionPolicy.TriggerBracketOrders
      ).pipe(
        take(1)
      ).subscribe();
    } else {
      this.wsOrdersService.submitMarketOrder(marketOrder, args.targetPortfolio).subscribe();
    }
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
