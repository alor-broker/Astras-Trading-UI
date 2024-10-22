import {
  Inject,
  Injectable
} from '@angular/core';
import { Position } from "../../../shared/models/positions/position.model";
import { CommandBase } from "./command-base";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { ScalperOrderBookInstantTranslatableNotificationsService } from "../services/scalper-order-book-instant-translatable-notifications.service";
import { Side } from "../../../shared/models/enums/side.model";
import { NewStopMarketOrder } from "../../../shared/models/orders/new-order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import { LocalOrderTracker } from "./local-order-tracker";
import { GuidGenerator } from "../../../shared/utils/guid";
import { take } from "rxjs";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

export interface StopMarketOrderTracker extends LocalOrderTracker<NewStopMarketOrder> {
  beforeOrderCreated: (order: NewStopMarketOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface SetStopLossCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
  triggerPrice: number;
  silent: boolean;
  orderTracker?: StopMarketOrderTracker;
}

@Injectable()
export class SetStopLossCommand extends CommandBase<SetStopLossCommandArgs> {
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly notification: ScalperOrderBookInstantTranslatableNotificationsService,
  ) {
    super();
  }

  execute(args: SetStopLossCommandArgs): void {
    if (args.currentPosition == null || args.currentPosition.qtyTFutureBatch === 0 || !args.currentPosition.avgPrice) {
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
      condition: side === Side.Sell ? LessMore.LessOrEqual : LessMore.MoreOrEqual,
      meta: {
        trackId: GuidGenerator.newGuid()
      }
    };

    if (args.silent) {
      args.orderTracker?.beforeOrderCreated(order);

      this.orderCommandService.submitStopMarketOrder(order, args.currentPosition.portfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (order.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(order.meta.trackId, result.isSuccess);
        }
      });
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
