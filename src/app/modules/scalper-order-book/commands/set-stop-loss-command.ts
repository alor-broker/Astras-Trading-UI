import { Injectable } from '@angular/core';
import { Position } from "../../../shared/models/positions/position.model";
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { ScalperOrderBookInstantTranslatableNotificationsService } from "../services/scalper-order-book-instant-translatable-notifications.service";
import { Side } from "../../../shared/models/enums/side.model";
import { NewStopMarketOrder } from "../../../shared/models/orders/new-order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";

export interface SetStopLossCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
  triggerPrice: number;
  silent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SetStopLossCommand extends CommandBase<SetStopLossCommandArgs> {
  constructor(
    private readonly wsOrdersService: WsOrdersService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly notification: ScalperOrderBookInstantTranslatableNotificationsService,
  ) {
    super();
  }

  execute(args: SetStopLossCommandArgs): void {
    if (!args.currentPosition || args.currentPosition.qtyTFutureBatch === 0 || !args.currentPosition.avgPrice) {
      this.notification.emptyPositions();
      return;
    }

    const side = args.currentPosition.qtyTFutureBatch < 0 ? Side.Buy : Side.Sell;

    const order: NewStopMarketOrder = {
      side: side,
      quantity: Math.abs(args.currentPosition.qtyTFutureBatch),
      instrument: {
        symbol: args.currentPosition.symbol,
        exchange: args.currentPosition.exchange,
        instrumentGroup: args.targetInstrumentBoard
      },
      triggerPrice: args.triggerPrice,
      condition: side === Side.Sell ? LessMore.LessOrEqual : LessMore.MoreOrEqual
    };

    if (args.silent) {
      this.wsOrdersService.submitStopMarketOrder(order, args.currentPosition.portfolio).subscribe();
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: order.instrument,
        initialValues: {
          orderType: OrderFormType.Stop,
          quantity: order.quantity,
          stopOrder: {
            limit: false,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            disableCalculations: true
          }
        }
      });
    }
  }
}
