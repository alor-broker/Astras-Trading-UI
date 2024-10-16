import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandBase } from "./command-base";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { MathHelper } from "../../../shared/utils/math-helper";
import { NewStopLimitOrder } from "../../../shared/models/orders/new-order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import { LocalOrderTracker } from "./local-order-tracker";
import { GuidGenerator } from "../../../shared/utils/guid";
import { take } from "rxjs";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

export interface StopLimitOrderTracker extends LocalOrderTracker<NewStopLimitOrder> {
  beforeOrderCreated: (order: NewStopLimitOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface SubmitStopLimitOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  triggerPrice: number;
  priceOptions?: {
    distance: number;
    priceStep: number;
  };
  quantity: number;
  targetPortfolio: string;
  silent: boolean;
  orderTracker?: StopLimitOrderTracker;
}

@Injectable({
  providedIn: 'root'
})
export class SubmitStopLimitOrderCommand extends CommandBase<SubmitStopLimitOrderCommandArgs> {
  constructor(
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

  execute(args: SubmitStopLimitOrderCommandArgs): void {
    let orderPrice = args.triggerPrice;

    if (args.priceOptions != null) {
      orderPrice = args.side === Side.Sell
        ? MathHelper.roundPrice(orderPrice - args.priceOptions.distance * args.priceOptions.priceStep, args.priceOptions.priceStep)
        : MathHelper.roundPrice(orderPrice + args.priceOptions.distance * args.priceOptions.priceStep, args.priceOptions.priceStep);
    }

    const order: NewStopLimitOrder = {
      instrument: toInstrumentKey(args.instrumentKey),
      side: args.side,
      quantity: args.quantity,
      triggerPrice: args.triggerPrice,
      price: orderPrice,
      condition: args.side === Side.Buy ? LessMore.MoreOrEqual : LessMore.LessOrEqual,
      meta: {
        trackId: GuidGenerator.newGuid()
      }
    };

    if (args.silent) {
      args.orderTracker?.beforeOrderCreated(order);

      this.orderCommandService.submitStopLimitOrder(order, args.targetPortfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (order.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(order.meta.trackId, result.isSuccess);
        }
      });
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Stop,
          price: order.price,
          quantity: order.quantity,
          stopOrder: {
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            limit: true,
            disableCalculations: true
          }
        }
      });
    }
  }
}
