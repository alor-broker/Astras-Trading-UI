import { Inject, Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewStopLimitOrder
} from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderType } from "../../../shared/models/orders/order.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { take } from "rxjs";
import { LocalOrderTracker } from "./local-order-tracker";
import {
  BracketCommand,
  BracketOptions
} from "./bracket-command";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

export interface LimitOrderTracker extends LocalOrderTracker<NewLimitOrder> {
  beforeOrderCreated: (order: NewLimitOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface SubmitLimitOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  price: number;
  targetPortfolio: string;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  silent: boolean;
  orderTracker?: LimitOrderTracker;
  allowMargin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubmitLimitOrderCommand extends BracketCommand<SubmitLimitOrderCommandArgs> {
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

  execute(args: SubmitLimitOrderCommandArgs): void {
    const limitOrder = this.prepareLimitOrder(args);

    let getProfitOrder: NewStopLimitOrder | null = null;
    let stopLossOrder: NewStopLimitOrder | null = null;

    if (this.shouldApplyBracket(args.bracketOptions, limitOrder)) {
      getProfitOrder = this.prepareGetProfitOrder(
        limitOrder,
        limitOrder.price,
        args.bracketOptions!,
        args.priceStep
      );
      stopLossOrder = this.prepareStopLossOrder(
        limitOrder,
        limitOrder.price,
        args.bracketOptions!,
        args.priceStep
      );
    }

    if (args.silent) {
      this.submitOrderSilent(
        limitOrder,
        getProfitOrder,
        stopLossOrder,
        args
      );
    } else {
      this.openOrderDialog(limitOrder, getProfitOrder, stopLossOrder);
    }
  }

  protected prepareLimitOrder(args: SubmitLimitOrderCommandArgs): NewLimitOrder {
    return {
      instrument: toInstrumentKey(args.instrumentKey),
      price: args.price,
      quantity: args.quantity,
      side: args.side,
      meta: {
        trackId: GuidGenerator.newGuid()
      }
    };
  }

  private openOrderDialog(
    limitOrder: NewLimitOrder,
    getProfitOrder: NewStopLimitOrder | null,
    stopLossOrder: NewStopLimitOrder | null
  ): void {
    const dialogParams: OrderDialogParams = {
      instrumentKey: limitOrder.instrument,
      initialValues: {
        orderType: OrderFormType.Limit,
        quantity: limitOrder.quantity,
        price: limitOrder.price,
        bracket: {}
      }
    };

    const stopOrders = [
      getProfitOrder,
      stopLossOrder
    ].filter((o): o is NewStopLimitOrder => !!o);

    const moreOrEqualOrder = stopOrders.find(o => o.condition === LessMore.MoreOrEqual);
    const lessOrEqualOrder = stopOrders.find(o => o.condition === LessMore.LessOrEqual);

    if (moreOrEqualOrder != null) {
      dialogParams.initialValues.bracket!.topOrderPrice = moreOrEqualOrder.triggerPrice;
      dialogParams.initialValues.bracket!.topOrderSide = moreOrEqualOrder.side;
    }

    if (lessOrEqualOrder != null) {
      dialogParams.initialValues.bracket!.bottomOrderPrice = lessOrEqualOrder.triggerPrice;
      dialogParams.initialValues.bracket!.bottomOrderSide = lessOrEqualOrder.side;
    }

    this.ordersDialogService.openNewOrderDialog(dialogParams);
  }

  private submitOrderSilent(
    limitOrder: NewLimitOrder,
    getProfitOrder: NewStopLimitOrder | null,
    stopLossOrder: NewStopLimitOrder | null,
    args: SubmitLimitOrderCommandArgs
  ): void {
    args.orderTracker?.beforeOrderCreated(limitOrder);
    limitOrder.allowMargin = args.allowMargin;

    if (getProfitOrder != null || stopLossOrder != null) {
      const orders: NewLinkedOrder[] = [
        {
          ...limitOrder,
          type: OrderType.Limit
        }
      ];

      if (getProfitOrder != null) {
        orders.push({
          ...getProfitOrder,
          type: OrderType.StopLimit,
          allowMargin: args.allowMargin
        });
      }

      if (stopLossOrder != null) {
        orders.push({
          ...stopLossOrder,
          type: OrderType.StopLimit,
          allowMargin: args.allowMargin
        });
      }

      this.orderCommandService.submitOrdersGroup(orders, args.targetPortfolio, ExecutionPolicy.TriggerBracketOrders).pipe(
        take(1)
      ).subscribe(result => {
        if (limitOrder.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(limitOrder.meta.trackId, result != null);
        }
      });
    } else {
      this.orderCommandService.submitLimitOrder(limitOrder, args.targetPortfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (limitOrder.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(limitOrder.meta.trackId, result.isSuccess);
        }
      });
    }
  }
}
