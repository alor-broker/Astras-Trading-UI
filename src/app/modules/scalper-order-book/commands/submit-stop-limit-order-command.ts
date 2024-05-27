import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { MathHelper } from "../../../shared/utils/math-helper";
import { NewStopLimitOrder } from "../../../shared/models/orders/new-order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";

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
}

@Injectable({
  providedIn: 'root'
})
export class SubmitStopLimitOrderCommand extends CommandBase<SubmitStopLimitOrderCommandArgs> {
  constructor(
    private readonly wsOrdersService: WsOrdersService,
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
    };

    if (args.silent) {
      this.wsOrdersService.submitStopLimitOrder(order, args.targetPortfolio).subscribe();
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
